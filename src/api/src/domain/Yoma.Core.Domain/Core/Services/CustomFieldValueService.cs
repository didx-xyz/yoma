using FluentValidation;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Transactions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Core.Services
{
  public sealed class CustomFieldValueService : ICustomFieldValueService
  {
    #region Class Variables
    private readonly ICustomFieldDefinitionService _customFieldDefinitionService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IRepository<CustomFieldValue> _customFieldValueRepository;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public CustomFieldValueService(ICustomFieldDefinitionService customFieldDefinitionService,
      ICountryService countryService,
      ILanguageService languageService,
      ISkillService skillService,
      IRepository<CustomFieldValue> customFieldValueRepository,
      IExecutionStrategyService executionStrategyService)
    {
      _customFieldDefinitionService = customFieldDefinitionService ?? throw new ArgumentNullException(nameof(customFieldDefinitionService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _skillService = skillService ?? throw new ArgumentNullException(nameof(skillService));
      _customFieldValueRepository = customFieldValueRepository ?? throw new ArgumentNullException(nameof(customFieldValueRepository));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members
    public void Validate(CustomFieldEntityType entityType, string? entityContext, List<CustomFieldValueRequest>? customFields, CustomFieldUpsertMode mode)
    {
      ValidateUpsertMode(mode);
      ValidateAndNormalize(entityType, entityContext, customFields, mode);
    }

    public List<CustomFieldValueRequest>? ParseCSVValues(
      CustomFieldEntityType entityType,
      string? entityContext,
      IReadOnlyDictionary<string, string?>? values)
    {
      if (values == null || values.Count == 0) return null;

      var definitions = _customFieldDefinitionService.List(entityType, entityContext, true, true);
      var definitionsByKey = definitions.ToDictionary(o => o.Key, StringComparer.OrdinalIgnoreCase);
      var result = new List<CustomFieldValueRequest>();

      foreach (var item in values)
      {
        if (!definitionsByKey.TryGetValue(item.Key, out var definition))
        {
          // A shared CSV template may contain columns for several opportunity types.
          // Blank non-applicable cells are ignored; populated cells are rejected.
          if (string.IsNullOrEmpty(item.Value)) continue;

          throw new ValidationException(
            $"Custom field '{item.Key}' does not apply to entity context '{entityContext}'");
        }

        var request = new CustomFieldValueRequest { Key = definition.Key };
        if (string.IsNullOrEmpty(item.Value))
        {
          // Key-only PATCH items are normalized into explicit deletions by the
          // Opportunity or MyOpportunity domain entry point.
          result.Add(request);
          continue;
        }

        if (definition.DataType == CustomFieldDataType.Option)
        {
          var optionValues = item.Value
            .Split(CSVImportHelper.Value_Delimiter)
            .Select(o => o.Trim())
            .ToList();

          if (optionValues.Any(string.IsNullOrEmpty))
            throw new ValidationException(
              $"Custom field '{definition.Title}' contains an empty option value");

          request.Values = [.. optionValues.Select(o => NormalizeCSVOptionValue(definition, o))];
        }
        else
        {
          request.Value = NormalizeCSVScalarValue(definition, item.Value);
        }

        result.Add(request);
      }

      return result.Count == 0 ? null : result;
    }

    public void ValidateAndHydrateFilters(CustomFieldEntityType entityType, List<CustomFieldFilter>? filters)
    {
      if (filters == null || filters.Count == 0) return;

      foreach (var filter in filters)
      {
        var definition = _customFieldDefinitionService.GetByKey(entityType, filter.Key, true, true);

        filter.Key = definition.Key;
        filter.DataType = definition.DataType;

        ValidateFilterOperator(definition, filter);
        NormalizeFilterValues(definition, filter);
      }
    }

    public async Task<List<CustomFieldValueItem>?> Upsert(
      CustomFieldEntityType entityType,
      string? entityContext,
      string? entityContextPrevious,
      Guid? opportunityId,
      Guid? myOpportunityId,
      List<CustomFieldValueRequest>? customFields,
      CustomFieldUpsertMode mode)
    {
      ValidateUpsertMode(mode);

      var entityId = ResolveEntityId(entityType, opportunityId, myOpportunityId);
      var (definitions, values, definitionIdsToDelete) = ValidateAndNormalize(entityType, entityContext, customFields, mode);

      var definitionsAffected = definitions;

      // When the entity context changes, include active definitions from the previous
      // context so values that no longer apply are removed during the same upsert.
      if (!string.IsNullOrEmpty(entityContextPrevious) &&
          !string.Equals(entityContextPrevious, entityContext, StringComparison.OrdinalIgnoreCase))
      {
        var definitionsPrevious = _customFieldDefinitionService.List(
          entityType,
          entityContextPrevious,
          false,
          true);

        definitionsAffected =
        [
          .. definitions
          .Concat(definitionsPrevious)
          .DistinctBy(o => o.Id)
        ];
      }

      if (definitionsAffected.Count == 0) return null;

      var currentDefinitionIds = definitions.Select(o => o.Id).ToHashSet();

      // definitionsAffected contains definitions for both the current and previous
      // contexts after a context/type change. Anything absent from currentDefinitionIds
      // belonged only to the previous context and is no longer valid for the entity.
      // Delete those values in both PUT and PATCH modes: PATCH preserves omitted values
      // only while their definitions remain applicable to the current context.
      var previousContextOnlyDefinitionIds = definitionsAffected
        .Where(o => !currentDefinitionIds.Contains(o.Id))
        .Select(o => o.Id)
        .ToHashSet();

      var definitionIdsExplicitlyDeleted = definitionIdsToDelete.ToHashSet();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.Required);

        var definitionIds = definitionsAffected.Select(o => o.Id).ToList();
        var existingValues = Query(entityType, entityId)
          .Where(o => definitionIds.Contains(o.CustomFieldDefinitionId))
          .ToList();

        var valuesByDefinition = values.ToDictionary(o => o.CustomFieldDefinitionId);

        foreach (var existingValue in existingValues.Where(
                   o => !valuesByDefinition.ContainsKey(o.CustomFieldDefinitionId)))
        {
          // PUT deletes every omitted value. PATCH preserves omissions and deletes only
          // explicit key-only requests or values invalidated by a context/type change.
          var delete = mode.DeleteOmitted() ||
            definitionIdsExplicitlyDeleted.Contains(existingValue.CustomFieldDefinitionId) ||
            previousContextOnlyDefinitionIds.Contains(existingValue.CustomFieldDefinitionId);

          if (delete)
            await _customFieldValueRepository.Delete(existingValue);
        }

        foreach (var value in values)
        {
          var existingValue = existingValues.SingleOrDefault(
            o => o.CustomFieldDefinitionId == value.CustomFieldDefinitionId);

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

      if (mode == CustomFieldUpsertMode.PatchAllowMissingRequired)
      {
        // PATCH returns the complete current state, including values preserved because
        // they were omitted from this partial request.
        var definitionIds = definitions.Select(o => o.Id).ToList();
        var valuesCurrent = Query(entityType, entityId)
          .Where(o => definitionIds.Contains(o.CustomFieldDefinitionId))
          .ToList();

        return ToCustomFieldValueItems(definitions, valuesCurrent);
      }

      return ToCustomFieldValueItems(definitions, values);
    }

    public async Task Delete(CustomFieldEntityType entityType, Guid entityId)
    {
      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.Required);

        var values = Query(entityType, entityId).ToList();

        foreach (var value in values)
          await _customFieldValueRepository.Delete(value);

        scope.Complete();
      });
    }
    #endregion

    #region Private Members
    private (List<CustomFieldDefinition> Definitions, List<CustomFieldValue> Values, List<Guid> DefinitionIdsToDelete) ValidateAndNormalize(
      CustomFieldEntityType entityType,
      string? entityContext,
      List<CustomFieldValueRequest>? customFields,
      CustomFieldUpsertMode mode)
    {
      var definitions = _customFieldDefinitionService.List(entityType, entityContext, true, true);
      var requests = customFields ?? [];

      if (requests.Count == 0 && definitions.Count == 0)
        return (definitions, [], []);

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

      var enforceRequired = mode.EnforceRequired();
      var values = new List<CustomFieldValue>();
      var definitionIdsToDelete = new List<Guid>();

      foreach (var definition in definitions)
      {
        requestsByKey.TryGetValue(definition.Key, out var request);

        if (request == null)
        {
          if (enforceRequired && definition.IsRequired)
            throw new ValidationException($"Custom field '{definition.Title}' is required");

          continue;
        }

        if (request.Delete)
        {
          // Explicit deletion is a PATCH-only instruction produced by NormalizeForPatch.
          // PUT requests must represent the complete desired state through omission.
          if (!mode.DeleteNullOrEmptyValues())
            throw new ValidationException($"Custom field '{definition.Title}' cannot be explicitly deleted");

          if (!string.IsNullOrWhiteSpace(request.Value) || request.Values?.Count > 0)
            throw new ValidationException($"Custom field '{definition.Title}' cannot specify a value when being deleted");

          definitionIdsToDelete.Add(definition.Id);
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

      return (definitions, values, definitionIdsToDelete);
    }

    private static void ValidateUpsertMode(CustomFieldUpsertMode mode)
    {
      if (!mode.Process())
        throw new InvalidOperationException($"Custom field upsert mode '{mode}' does not process custom fields");
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

    private string? Normalize(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      var hasValue = !string.IsNullOrWhiteSpace(request.Value);
      var hasValues = request.Values?.Count > 0;

      if (hasValue && hasValues)
        throw new ValidationException($"Custom field '{definition.Title}' must specify either value or values, not both");

      if (!hasValue && !hasValues)
      {
        var propertyName = definition.DataType == CustomFieldDataType.Option ? "values" : "value";
        throw new ValidationException($"Custom field '{definition.Title}' must specify {propertyName}");
      }

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
        throw new ValidationException($"Custom field '{definition.Title}' must specify value; values is only supported for option fields");

      return request.Value!.Trim();
    }

    private static string NormalizeInteger(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' must specify value; values is only supported for option fields");

      if (!int.TryParse(request.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be a valid integer");

      return value.ToString(CultureInfo.InvariantCulture);
    }

    private static string NormalizeDecimal(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' must specify value; values is only supported for option fields");

      if (!decimal.TryParse(request.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be a valid decimal");

      return value.ToString(CultureInfo.InvariantCulture);
    }

    private static string NormalizeBoolean(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' must specify value; values is only supported for option fields");

      if (!bool.TryParse(request.Value, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be true or false");

      return value.ToString().ToLowerInvariant();
    }

    private static string NormalizeDateTime(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values != null)
        throw new ValidationException($"Custom field '{definition.Title}' must specify value; values is only supported for option fields");

      if (!DateTimeOffset.TryParse(request.Value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var value))
        throw new ValidationException($"Custom field '{definition.Title}' must be a valid date/time");

      return value.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture);
    }

    private string NormalizeOption(CustomFieldDefinition definition, CustomFieldValueRequest request)
    {
      if (request.Values == null || request.Values.Count == 0)
        throw new ValidationException($"Custom field '{definition.Title}' must specify values; value is not supported for option fields");

      if (request.Values.Any(string.IsNullOrWhiteSpace))
        throw new ValidationException($"Custom field '{definition.Title}' contains an empty option value");

      if (definition.SupportsMultiple != true && request.Values.Count != 1)
        throw new ValidationException($"Custom field '{definition.Title}' is single-select and must specify exactly one item in values");

      var values = request.Values
        .Select(o => NormalizeOptionValue(definition, o))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .ToList();

      if (definition.SupportsMultiple != true)
        return values.Single();

      return new CustomFieldValue
      {
        Values = values
      }.Value!;
    }

    private static string NormalizeCSVScalarValue(CustomFieldDefinition definition, string value)
    {
      value = value.Trim();

      if (definition.DataType != CustomFieldDataType.Boolean)
        return value;

      // Accept the same user-friendly boolean values used elsewhere in CSV imports,
      // while retaining true/false support for generated files.
      if (string.Equals(value, CSVImportHelper.Boolean_Value_True, StringComparison.OrdinalIgnoreCase)) return bool.TrueString;
      if (string.Equals(value, CSVImportHelper.Boolean_Value_False, StringComparison.OrdinalIgnoreCase)) return bool.FalseString;

      return value;
    }

    private string NormalizeCSVOptionValue(CustomFieldDefinition definition, string value)
    {
      value = value.Trim();

      if (definition.LookupType.HasValue)
      {
        // Match the established CSV lookup conventions: country and language use
        // alpha-2 codes, while skills use their full display names.
        var id = definition.LookupType.Value switch
        {
          CustomFieldLookupType.Country => _countryService.GetByCodeAlpha2OrNull(value)?.Id,
          CustomFieldLookupType.Language => _languageService.GetByCodeAlpha2OrNull(value)?.Id,
          CustomFieldLookupType.Skill => _skillService.GetByNameOrNull(value)?.Id,
          _ => throw new ArgumentOutOfRangeException(
            nameof(definition),
            $"Custom field lookup type '{definition.LookupType}' is not supported")
        };

        return id?.ToString() ?? throw new ValidationException(
          $"Custom field '{definition.Title}' contains an invalid lookup value: {value}");
      }

      var option = definition.Options?
        .SingleOrDefault(o =>
          o.IsActive &&
          (string.Equals(o.Name, value, StringComparison.OrdinalIgnoreCase) ||
           string.Equals(o.Key, value, StringComparison.OrdinalIgnoreCase)));

      return option == null
        ? throw new ValidationException(
          $"Custom field '{definition.Title}' contains an invalid option value: {value}")
        : option.Key;
    }

    private string NormalizeOptionValue(CustomFieldDefinition definition, string value)
    {
      value = value.Trim();

      if (value.Contains(CustomFieldValue.Value_Delimiter))
        throw new ValidationException(
          $"Custom field '{definition.Title}' contains an invalid option value");

      if (definition.LookupType.HasValue)
      {
        var normalized = NormalizeLookupValue(
          definition.LookupType.Value,
          value);

        return normalized ?? throw new ValidationException(
          $"Custom field '{definition.Title}' contains an invalid lookup value: {value}");
      }

      var option = definition.Options?
        .SingleOrDefault(o =>
          o.IsActive &&
          string.Equals(o.Key, value, StringComparison.OrdinalIgnoreCase));

      return option == null
        ? throw new ValidationException(
          $"Custom field '{definition.Title}' contains an invalid option value: {value}")
        : option.Key;
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

    private static void ValidateFilterOperator(CustomFieldDefinition definition, CustomFieldFilter filter)
    {
      var supported = definition.DataType switch
      {
        CustomFieldDataType.String =>
          filter.Operator is
            CustomFieldFilterOperator.Equals or
            CustomFieldFilterOperator.Contains or
            CustomFieldFilterOperator.AnyOf or
            CustomFieldFilterOperator.Exists,

        CustomFieldDataType.Integer or
        CustomFieldDataType.Decimal or
        CustomFieldDataType.Boolean or
        CustomFieldDataType.DateTime =>
          filter.Operator is
            CustomFieldFilterOperator.Equals or
            CustomFieldFilterOperator.AnyOf or
            CustomFieldFilterOperator.Exists,

        CustomFieldDataType.Option =>
          filter.Operator is
            CustomFieldFilterOperator.Equals or
            CustomFieldFilterOperator.AnyOf or
            CustomFieldFilterOperator.AllOf or
            CustomFieldFilterOperator.Exists,

        _ => false
      };

      if (!supported)
        throw new ValidationException(
          $"Custom field '{definition.Title}' does not support filter operator '{filter.Operator}'");

      if (filter.Operator == CustomFieldFilterOperator.AllOf &&
          definition.SupportsMultiple != true)
      {
        throw new ValidationException(
          $"Custom field '{definition.Title}' does not support multiple values");
      }
    }

    private void NormalizeFilterValues(CustomFieldDefinition definition, CustomFieldFilter filter)
    {
      switch (filter.Operator)
      {
        case CustomFieldFilterOperator.Exists:
          return;

        case CustomFieldFilterOperator.Contains:
          filter.Value = filter.Value!.Trim();
          return;

        case CustomFieldFilterOperator.Equals:
          filter.Value = NormalizeFilterValue(definition, filter.Value!);
          return;

        case CustomFieldFilterOperator.AnyOf:
        case CustomFieldFilterOperator.AllOf:
          filter.Values =
          [
            .. filter.Values!
          .Select(o => NormalizeFilterValue(definition, o))
          .Distinct(StringComparer.Ordinal)
          ];
          return;

        default:
          throw new ArgumentOutOfRangeException(
            nameof(filter),
            $"Custom field filter operator '{filter.Operator}' is not supported");
      }
    }

    private string NormalizeFilterValue(CustomFieldDefinition definition, string value)
    {
      var request = new CustomFieldValueRequest
      {
        Value = value
      };

      return definition.DataType switch
      {
        CustomFieldDataType.String =>
          NormalizeString(definition, request),

        CustomFieldDataType.Integer =>
          NormalizeInteger(definition, request),

        CustomFieldDataType.Decimal =>
          NormalizeDecimal(definition, request),

        CustomFieldDataType.Boolean =>
          NormalizeBoolean(definition, request),

        CustomFieldDataType.DateTime =>
          NormalizeDateTime(definition, request),

        CustomFieldDataType.Option =>
          NormalizeOptionValue(definition, value),

        _ => throw new ArgumentOutOfRangeException(
          nameof(definition),
          $"Custom field data type '{definition.DataType}' is not supported")
      };
    }

    private string? NormalizeLookupValue(CustomFieldLookupType lookupType, string value)
    {
      value = value.Trim();
      if (string.IsNullOrEmpty(value)) return null;

      if (!Guid.TryParse(value, out var id) || id == Guid.Empty)
        return null;

      return lookupType switch
      {
        CustomFieldLookupType.Country =>
          _countryService.GetByIdOrNull(id)?.Id.ToString(),

        CustomFieldLookupType.Language =>
          _languageService.GetByIdOrNull(id)?.Id.ToString(),

        CustomFieldLookupType.Skill =>
          _skillService.GetByIdOrNull(id)?.Id.ToString(),

        _ => throw new ArgumentOutOfRangeException(
          nameof(lookupType),
          $"Custom field lookup type '{lookupType}' is not supported")
      };
    }
    #endregion
  }
}
