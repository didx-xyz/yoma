using FluentValidation;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Services
{
  public sealed class CustomFieldValueService : ICustomFieldValueService
  {
    #region Class Variables
    private readonly ICustomFieldDefinitionService _customFieldDefinitionService;
    private readonly IRepository<CustomFieldValue> _customFieldValueRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public CustomFieldValueService(ICustomFieldDefinitionService customFieldDefinitionService,
        IRepository<CustomFieldValue> customFieldValueRepository,
        IExecutionStrategyService executionStrategyService)
    {
      _customFieldDefinitionService = customFieldDefinitionService ?? throw new ArgumentNullException(nameof(customFieldDefinitionService));
      _customFieldValueRepository = customFieldValueRepository ?? throw new ArgumentNullException(nameof(customFieldValueRepository));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members
    public void Validate(CustomFieldEntityType entityType, string? entityContext, List<CustomFieldValueRequest>? customFields)
    {
      ValidateAndNormalize(entityType, entityContext, customFields);
    }

    public async Task<List<CustomFieldValueItem>?> Upsert(CustomFieldEntityType entityType, string? entityContext, Guid? opportunityId, Guid? myOpportunityId, List<CustomFieldValueRequest>? customFields)
    {
      var entityId = ResolveEntityId(entityType, opportunityId, myOpportunityId);
      var (definitions, values) = ValidateAndNormalize(entityType, entityContext, customFields);

      if (definitions.Count == 0) return null;

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.Required);

        var definitionIds = definitions.Select(o => o.Id).ToList();
        var existingValues = Query(entityType, entityId)
          .Where(o => definitionIds.Contains(o.CustomFieldDefinitionId))
          .ToList();

        var valuesByDefinition = values.ToDictionary(o => o.CustomFieldDefinitionId);

        foreach (var existingValue in existingValues.Where(o => !valuesByDefinition.ContainsKey(o.CustomFieldDefinitionId)))
          await _customFieldValueRepository.Delete(existingValue);

        foreach (var value in values)
        {
          var existingValue = existingValues.SingleOrDefault(o => o.CustomFieldDefinitionId == value.CustomFieldDefinitionId);
          if (existingValue == null)
          {
            SetEntityId(entityType, entityId, value);
            await _customFieldValueRepository.Create(value);
            continue;
          }

          existingValue.Value = value.Value;
          await _customFieldValueRepository.Update(existingValue);
        }

        scope.Complete();
      });

      return ToCustomFieldValueItems(definitions, values);
    }
    #endregion

    #region Private Members
    private (List<CustomFieldDefinition> Definitions, List<CustomFieldValue> Values) ValidateAndNormalize(CustomFieldEntityType entityType, string? entityContext, List<CustomFieldValueRequest>? customFields)
    {
      var definitions = _customFieldDefinitionService.List(entityType, entityContext, true, true);
      var requests = customFields ?? [];

      if (requests.Count == 0 && definitions.Count == 0)
        return (definitions, []);

      var duplicateKeys = requests
        .Where(o => !string.IsNullOrWhiteSpace(o.Key))
        .GroupBy(o => o.Key.Trim(), StringComparer.OrdinalIgnoreCase)
        .Where(o => o.Count() > 1)
        .Select(o => o.Key)
        .ToList();

      if (duplicateKeys.Count != 0)
        throw new ValidationException($"Duplicate custom field key(s): {string.Join(", ", duplicateKeys)}");

      var requestsByKey = requests
        .Where(o => !string.IsNullOrWhiteSpace(o.Key))
        .ToDictionary(o => o.Key.Trim(), StringComparer.OrdinalIgnoreCase);

      var definitionsByKey = definitions.ToDictionary(o => o.Key, StringComparer.OrdinalIgnoreCase);
      var unknownKeys = requestsByKey.Keys.Where(o => !definitionsByKey.ContainsKey(o)).ToList();

      if (unknownKeys.Count != 0)
        throw new ValidationException($"Unknown custom field key(s): {string.Join(", ", unknownKeys)}");

      var values = new List<CustomFieldValue>();

      foreach (var definition in definitions)
      {
        requestsByKey.TryGetValue(definition.Key, out var request);

        if (request == null)
        {
          if (definition.IsRequired)
            throw new ValidationException($"Custom field '{definition.Title}' is required");

          continue;
        }

        var value = Normalize(definition, request);
        if (string.IsNullOrWhiteSpace(value))
        {
          if (definition.IsRequired)
            throw new ValidationException($"Custom field '{definition.Title}' is required");

          continue;
        }

        values.Add(new CustomFieldValue
        {
          CustomFieldDefinitionId = definition.Id,
          Value = value
        });
      }

      return (definitions, values);
    }

    private IQueryable<CustomFieldValue> Query(CustomFieldEntityType entityType, Guid entityId)
    {
      return entityType switch
      {
        CustomFieldEntityType.Opportunity => _customFieldValueRepository.Query().Where(o => o.OpportunityId == entityId),
        CustomFieldEntityType.MyOpportunity => _customFieldValueRepository.Query().Where(o => o.MyOpportunityId == entityId),
        _ => throw new ArgumentOutOfRangeException(nameof(entityType), $"Entity type '{entityType}' is not supported")
      };
    }

    private static Guid ResolveEntityId(CustomFieldEntityType entityType, Guid? opportunityId, Guid? myOpportunityId)
    {
      return entityType switch
      {
        CustomFieldEntityType.Opportunity => opportunityId ?? throw new ArgumentNullException(nameof(opportunityId)),
        CustomFieldEntityType.MyOpportunity => myOpportunityId ?? throw new ArgumentNullException(nameof(myOpportunityId)),
        _ => throw new ArgumentOutOfRangeException(nameof(entityType), $"Entity type '{entityType}' is not supported")
      };
    }

    private static void SetEntityId(CustomFieldEntityType entityType, Guid entityId, CustomFieldValue value)
    {
      switch (entityType)
      {
        case CustomFieldEntityType.Opportunity:
          value.OpportunityId = entityId;
          break;

        case CustomFieldEntityType.MyOpportunity:
          value.MyOpportunityId = entityId;
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(entityType), $"Entity type '{entityType}' is not supported");
      }
    }

    private static string? Normalize(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      var hasValue = !string.IsNullOrWhiteSpace(request.Value);
      var hasValues = request.Values?.Count > 0;

      if (hasValue && hasValues)
        throw new ValidationException($"Custom field '{definition.Title}' must specify either value or values, not both");

      if (!hasValue && !hasValues) return null;

      var value = definition.DataType switch
      {
        CustomFieldDataType.String => NormalizeString(definition, request),
        CustomFieldDataType.Integer => NormalizeInteger(definition, request),
        CustomFieldDataType.Decimal => NormalizeDecimal(definition, request),
        CustomFieldDataType.Boolean => NormalizeBoolean(definition, request),
        CustomFieldDataType.DateTime => NormalizeDateTime(definition, request),
        CustomFieldDataType.Option => NormalizeOption(definition, request),
        _ => throw new ArgumentOutOfRangeException(nameof(definition), $"Custom field data type '{definition.DataType}' is not supported")
      };

      if (!string.IsNullOrEmpty(definition.ValidationRegex) && !Regex.IsMatch(value, definition.ValidationRegex))
        throw new ValidationException(definition.ValidationErrorMessage ?? $"Custom field '{definition.Title}' is invalid");

      return value;
    }

    private static string NormalizeString(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' expects a single value");

      return request.Value!.Trim();
    }

    private static string NormalizeInteger(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' expects a single value");

      if (!int.TryParse(request.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be a valid integer");

      return value.ToString(CultureInfo.InvariantCulture);
    }

    private static string NormalizeDecimal(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' expects a single value");

      if (!decimal.TryParse(request.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be a valid decimal");

      return value.ToString(CultureInfo.InvariantCulture);
    }

    private static string NormalizeBoolean(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' expects a single value");

      if (!bool.TryParse(request.Value, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be true or false");

      return value.ToString().ToLowerInvariant();
    }

    private static string NormalizeDateTime(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' expects a single value");

      if (!DateTimeOffset.TryParse(request.Value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be a valid date/time");

      return value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);
    }

    private static string NormalizeOption(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      var options = definition.Options?.Where(o => o.IsActive).ToDictionary(o => o.Key, StringComparer.OrdinalIgnoreCase) ?? [];

      if (definition.SupportsMultiple == true)
      {
        if (request.Values == null || request.Values.Count == 0)
          throw new ValidationException($"Custom field '{definition.Title}' expects one or more values");

        var values = request.Values.Select(o => o.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        if (values.Any(o => o.Contains(CustomFieldValue.Value_Delimiter)))
          throw new ValidationException($"Custom field '{definition.Title}' contains an invalid option value");

        var invalid = values.Where(o => !options.ContainsKey(o)).ToList();
        if (invalid.Count != 0)
          throw new ValidationException($"Custom field '{definition.Title}' contains invalid option value(s): {string.Join(", ", invalid)}");

        return new CustomFieldValue { Values = values }.Value!;
      }

      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' expects a single value");

      var value = request.Value!.Trim();

      if (value.Contains(CustomFieldValue.Value_Delimiter))
        throw new ValidationException($"Custom field '{definition.Title}' contains an invalid option value");

      if (!options.ContainsKey(value))
        throw new ValidationException($"Custom field '{definition.Title}' contains an invalid option value: {value}");

      return value;
    }

    private static List<CustomFieldValueItem>? ToCustomFieldValueItems(List<CustomFieldDefinition> definitions, List<CustomFieldValue> values)
    {
      if (values.Count == 0) return null;

      var definitionsById = definitions.ToDictionary(o => o.Id);

      return [.. values
        .Select(o =>
        {
          var definition = definitionsById[o.CustomFieldDefinitionId];

          return new CustomFieldValueItem
          {
            Key = definition.Key,
            DataType = definition.DataType,
            ValueRaw = o.Value
          };
        })];
    }
    #endregion
  }
}
