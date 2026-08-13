using FluentValidation;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;
using System.Globalization;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Validators;

namespace Yoma.Core.Domain.SSI.Services
{
  public class SSIWalletService : ISSIWalletService
  {
    #region Class Variables
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserService _userService;
    private readonly ISSIProviderClient _ssiProviderClient;
    private readonly ISSITenantService _ssiTenantService;
    private readonly ISSISchemaService _ssiSchemaService;
    private readonly SSIWalletSearchFilterValidator _ssiWalletSearchFilterValidator;
    #endregion

    #region Constructors
    public SSIWalletService(IHttpContextAccessor httpContextAccessor,
        IUserService userService,
        ISSIProviderClientFactory ssiProviderClientFactory,
        ISSITenantService ssiTenantService,
        ISSISchemaService ssiSchemaService,
        SSIWalletSearchFilterValidator ssiWalletFilterValidator)
    {
      _httpContextAccessor = httpContextAccessor;
      _userService = userService;
      _ssiProviderClient = ssiProviderClientFactory.CreateClient();
      _ssiTenantService = ssiTenantService;
      _ssiSchemaService = ssiSchemaService;
      _ssiWalletSearchFilterValidator = ssiWalletFilterValidator;
    }
    #endregion

    #region Public Members
    public async Task<SSICredential> GetUserCredentialById(string id)
    {
      if (string.IsNullOrWhiteSpace(id))
        throw new ArgumentNullException(nameof(id));
      id = id.Trim();

      var item = await _ssiProviderClient.GetCredentialById(GetUserTenantId(), id);

      return await ParseCredential<SSICredential>(item);
    }

    public async Task<SSIWalletSearchResults> SearchUserCredentials(SSIWalletSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      filter.EntityType = Entity.EntityType.User;
      filter.EntityId = user.Id;

      return await Search(filter);
    }
    #endregion

    #region Private Members
    private string GetUserTenantId()
    {
      var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var tenantId = _ssiTenantService.GetTenantId(Entity.EntityType.User, user.Id);
      return tenantId;
    }

    private async Task<SSIWalletSearchResults> Search(SSIWalletSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      await _ssiWalletSearchFilterValidator.ValidateAndThrowAsync(filter);

      var result = new SSIWalletSearchResults { Items = [] };

      var tenantId = _ssiTenantService.GetTenantIdOrNull(filter.EntityType, filter.EntityId);
      if (string.IsNullOrEmpty(tenantId)) return result; //tenant pending creation

      //filtered and ordered client side; no way to filter on schemaType or orderByDescending:_Date_Issued on Aries
      //var start = default(int?);
      //if (filter.PaginationEnabled)
      //    start = filter.PageNumber == 1 ? 0 : (filter.PageNumber - 1) * filter.PageSize;

      var items = await _ssiProviderClient.ListCredentials(tenantId);
      if (items == null || items.Count == 0) return result;

      //parse all credential items first — in AcaPy RC6, the schemaId alone is no longer sufficient 
      //to determine the schema type. Therefore, we must fully parse each credential before we can 
      //apply schema-type-based filtering (previously done via _ssiSchemaService.SchemaIdValidateAndGetParts).
      foreach (var item in items)
        result.Items.Add(await ParseCredential<SSICredentialInfo>(item));

      //schemaType filter
      if (filter.SchemaType.HasValue) result.Items = [.. result.Items.Where(o => o.SchemaType == filter.SchemaType.Value)];

      if (filter.TotalCountOnly)
      {
        result.TotalCount = items.Count;
        return result;
      }

      result.Items = [.. result.Items.OrderByDescending(o => o.DateIssued).ThenBy(o => o.Id)]; //ensure deterministic sorting / consistent pagination results

      //pagination (client side)
      if (filter.PaginationEnabled)
      {
        result.TotalCount = result.Items.Count;
        result.Items = [.. result.Items.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value)];
      }

      return result;
    }

    private async Task<T> ParseCredential<T>(Models.Provider.Credential item)
        where T : SSICredentialBase, new()
    {
      // The provider credential carries the immutable schema id, including the exact version used at issuance.
      // Wallet rendering must never resolve the latest version because labels and mappings may have changed since then.
      var schema = await _ssiSchemaService.GetById(item.SchemaId);

      var result = new T
      {
        Id = item.Id,
        ArtifactType = schema.ArtifactType,
        SchemaType = schema.Type,
        DateIssued = DateTimeHelper.TryParse(item.Attributes.SingleOrDefault(o => string.Equals(o.Key, SSISchemaService.SchemaAttribute_Internal_DateIssued, StringComparison.OrdinalIgnoreCase)).Value),
      };

      var systemProperties = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
          .Where(property => property.System).ToList();

      foreach (var property in systemProperties)
      {
        var attribute = GetCredentialAttributeOrNull(item, schema, property.AttributeName, property.Required);
        if (!attribute.HasValue) continue;

        switch (property.SystemType)
        {
          case SchemaEntityPropertySystemType.Title:
            result.Title = ParseCredentialAttributeValue(property, attribute.Value);
            break;

          case SchemaEntityPropertySystemType.Issuer:
            result.Issuer = ParseCredentialAttributeValue(property, attribute.Value);
            break;

          case SchemaEntityPropertySystemType.IssuerLogoURL:
            result.IssuerLogoURL = ParseCredentialAttributeValue(property, attribute.Value);
            break;

          default:
            throw new InvalidOperationException($"System property type '{property.SystemType}' not supported");
        }
      }

      if (typeof(T) == typeof(SSICredentialInfo)) return result;

      result.Attributes = [];

      var additionalProperties = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
          .Where(property => !property.System
          && !SSISchemaService.SchemaAttributes_Internal.Any(i => string.Equals(i, property.AttributeName, StringComparison.OrdinalIgnoreCase))).ToList();

      foreach (var property in additionalProperties)
      {
        var attribute = GetCredentialAttributeOrNull(item, schema, property.AttributeName, property.Required);
        if (attribute.HasValue) result.Attributes.Add(ParseCredentialAttribute(property, attribute.Value));
      }

      // Custom fields are a new credential capability and therefore require no legacy credential conversion. Their
      // labels and human-readable option / lookup values come from the exact issued schema and signed attributes.
      var customFields = schema.Entities.SelectMany(entity => entity.CustomFields ?? Enumerable.Empty<SSISchemaEntityCustomField>()).ToList();
      foreach (var customField in customFields)
      {
        var attribute = GetCredentialAttributeOrNull(item, schema, customField.AttributeName, customField.Required);
        if (attribute.HasValue) result.Attributes.Add(ParseCredentialAttribute(customField, attribute.Value));
      }

      result.Attributes = [.. result.Attributes.OrderBy(o => o.NameDisplay)];
      return result;
    }

    /// <summary>
    /// Existing credentials may either contain an optional attribute with the historical "n/a" value or omit it.
    /// Both remain valid: present values are rendered as signed, missing optional values are omitted, and only a
    /// missing required attribute is treated as a credential/schema inconsistency.
    /// </summary>
    private static KeyValuePair<string, string>? GetCredentialAttributeOrNull(Models.Provider.Credential credential,
      SSISchema schema, string attributeName, bool required)
    {
      var attribute = credential.Attributes.SingleOrDefault(o => string.Equals(o.Key, attributeName, StringComparison.OrdinalIgnoreCase));
      if (!string.IsNullOrEmpty(attribute.Key)) return attribute;

      if (required)
      {
        throw new InvalidOperationException(
          $"Credential with id '{credential.Id}' does not contain required attribute '{attributeName}' for schema '{schema.Id}'");
      }

      return null;
    }

    private static SSICredentialAttribute ParseCredentialAttribute(SSISchemaEntityProperty property, KeyValuePair<string, string> attribute)
    {
      var result = new SSICredentialAttribute
      {
        Name = property.AttributeName,
        NameDisplay = property.NameDisplay,
        ValueDisplay = ParseCredentialAttributeValue(property, attribute)
      };

      if (!property.TypeName.StartsWith("List<", StringComparison.OrdinalIgnoreCase)) return result;

      // New credentials sign list attributes as JSON. Existing production credentials stored Skills as a comma-
      // delimited string, so the API normalizes both representations and Web never parses provider data.
      result.ItemsDisplay = ParseCredentialAttributeItems(attribute.Value);
      result.ValueDisplay = result.ItemsDisplay.Count == 0
        ? "n/a"
        : string.Join(SSICredentialService.CredentialAttribute_OfTypeList_Delimiter, result.ItemsDisplay.Select(o => o.Name));
      return result;
    }

    private static SSICredentialAttribute ParseCredentialAttribute(SSISchemaEntityCustomField customField, KeyValuePair<string, string> attribute)
    {
      var result = new SSICredentialAttribute
      {
        Name = customField.AttributeName,
        NameDisplay = customField.NameDisplay,
        ValueDisplay = ParseCredentialAttributeValue(customField, attribute)
      };

      if (customField.SupportsMultiple != true) return result;

      result.ItemsDisplay = ParseCredentialAttributeItems(attribute.Value);
      result.ValueDisplay = result.ItemsDisplay.Count == 0
        ? "n/a"
        : string.Join(SSICredentialService.CredentialAttribute_OfTypeList_Delimiter, result.ItemsDisplay.Select(o => o.Name));
      return result;
    }

    private static List<SSICredentialAttributeItem> ParseCredentialAttributeItems(string? value)
    {
      value = value?.Trim();
      if (string.IsNullOrEmpty(value) || string.Equals(value, "n/a", StringComparison.OrdinalIgnoreCase)) return [];

      if (value.StartsWith('['))
      {
        try
        {
          var items = JsonConvert.DeserializeObject<List<SSICredentialAttributeItem>>(value)
            ?? throw new InvalidOperationException("Structured credential attribute deserialized to null");

          if (items.Any(item => string.IsNullOrWhiteSpace(item.Name)))
            throw new InvalidOperationException("Structured credential attribute contains an item with no name");

          items.ForEach(item => item.Name = item.Name.Trim());
          return items;
        }
        catch (JsonException ex)
        {
          throw new InvalidOperationException("Structured credential attribute contains invalid JSON", ex);
        }
      }

      return [.. value.Split(SSICredentialService.CredentialAttribute_OfTypeList_Delimiter,
          StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(name => new SSICredentialAttributeItem { Name = name })];
    }

    private static string ParseCredentialAttributeValue(SSISchemaEntityProperty property, KeyValuePair<string, string> attribute)
    {
      var result = attribute.Value?.Trim();
      if (string.IsNullOrEmpty(result)) return "n/a";

      var type = string.IsNullOrEmpty(property.DotNetType) ? null : Type.GetType(property.DotNetType);
      if (type == null) return result;
      type = Nullable.GetUnderlyingType(type) ?? type;

      if (type == typeof(string))
        return string.IsNullOrEmpty(property.Format) ? result : string.Format(CultureInfo.InvariantCulture, property.Format, result);
      else if (type == typeof(bool))
      {
        if (!bool.TryParse(result, out var value)) return result;
        return value ? "Yes" : "No";
      }
      else if (type == typeof(DateTimeOffset))
      {
        var value = ParseCredentialDateTimeOffset(result);
        if (!value.HasValue) return result;
        return string.IsNullOrEmpty(property.Format)
          ? value.Value.ToString("O", CultureInfo.InvariantCulture)
          : value.Value.ToString(property.Format, CultureInfo.InvariantCulture);
      }
      else if (type == typeof(DateTime))
      {
        var value = ParseCredentialDateTime(result);
        if (!value.HasValue) return result;
        return string.IsNullOrEmpty(property.Format)
          ? value.Value.ToString("O", CultureInfo.InvariantCulture)
          : value.Value.ToString(property.Format, CultureInfo.InvariantCulture);
      }
      else if (type == typeof(decimal))
      {
        if (!decimal.TryParse(result, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)) return result;
        return value.ToString(property.Format, CultureInfo.InvariantCulture);
      }
      else if (type == typeof(float))
      {
        if (!float.TryParse(result, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out var value)) return result;
        return value.ToString(property.Format, CultureInfo.InvariantCulture);
      }
      else if (type == typeof(int) || type == typeof(long) || type == typeof(short) || type == typeof(byte))
      {
        if (!long.TryParse(result, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value)) return result;
        return value.ToString(property.Format, CultureInfo.InvariantCulture);
      }

      if (string.IsNullOrEmpty(property.Format)) return result;
      throw new InvalidOperationException($"Formatting of '{property.Format}' for type '{type}' not supported");
    }

    private static string ParseCredentialAttributeValue(SSISchemaEntityCustomField customField, KeyValuePair<string, string> attribute)
    {
      var result = attribute.Value?.Trim();
      if (string.IsNullOrEmpty(result)) return "n/a";

      return customField.DataType switch
      {
        CustomFieldDataType.Boolean when bool.TryParse(result, out var value) => value ? "Yes" : "No",
        CustomFieldDataType.Integer when int.TryParse(result, NumberStyles.Integer, CultureInfo.InvariantCulture, out var value) =>
          value.ToString(CultureInfo.InvariantCulture),
        CustomFieldDataType.Decimal when decimal.TryParse(result, NumberStyles.Number, CultureInfo.InvariantCulture, out var value) =>
          value.ToString(CultureInfo.InvariantCulture),
        CustomFieldDataType.DateTime when DateTimeHelper.TryParse(result) is DateTimeOffset value =>
          value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        _ => result
      };
    }

    /// <summary>
    /// New credentials use invariant round-trip values. Historical credentials were serialized using the issuing API
    /// host culture, so current-culture parsing remains as a compatibility fallback after invariant parsing.
    /// </summary>
    private static DateTimeOffset? ParseCredentialDateTimeOffset(string value)
    {
      var result = DateTimeHelper.TryParse(value);
      if (result.HasValue) return result;

      if (!DateTimeOffset.TryParse(value, CultureInfo.CurrentCulture,
        DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var valueParsed) || valueParsed == default)
        return null;

      return valueParsed;
    }

    private static DateTime? ParseCredentialDateTime(string value)
    {
      if (DateTime.TryParse(value, CultureInfo.InvariantCulture,
        DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var result) && result != default)
        return result;

      if (!DateTime.TryParse(value, CultureInfo.CurrentCulture,
        DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out result) || result == default)
        return null;

      return result;
    }
    #endregion
  }
}
