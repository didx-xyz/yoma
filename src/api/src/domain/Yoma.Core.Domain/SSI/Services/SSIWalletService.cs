using FluentValidation;
using Microsoft.AspNetCore.Http;
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
    private readonly SSIWalletFilterValidator _ssiWalletFilterValidator;
    #endregion

    #region Constructors
    public SSIWalletService(IHttpContextAccessor httpContextAccessor,
        IUserService userService,
        ISSIProviderClientFactory ssiProviderClientFactory,
        ISSITenantService ssiTenantService,
        ISSISchemaService ssiSchemaService,
        SSIWalletFilterValidator ssiWalletFilterValidator)
    {
      _httpContextAccessor = httpContextAccessor;
      _userService = userService;
      _ssiProviderClient = ssiProviderClientFactory.CreateClient();
      _ssiTenantService = ssiTenantService;
      _ssiSchemaService = ssiSchemaService;
      _ssiWalletFilterValidator = ssiWalletFilterValidator;
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

    public async Task<SSIWalletSearchResults> SearchUserCredentials(SSIWalletFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

      filter.EntityType = Entity.EntityType.User;
      filter.EntityId = user.Id;

      return await Search(filter);
    }
    #endregion

    #region Private Members
    private string GetUserTenantId()
    {
      var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
      var tenantId = _ssiTenantService.GetTenantId(Entity.EntityType.User, user.Id);
      return tenantId;
    }

    private async Task<SSIWalletSearchResults> Search(SSIWalletFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      await _ssiWalletFilterValidator.ValidateAndThrowAsync(filter);

      var result = new SSIWalletSearchResults { Items = [] };

      var tenantId = _ssiTenantService.GetTenantIdOrNull(filter.EntityType, filter.EntityId);
      if (string.IsNullOrEmpty(tenantId)) return result; //tenant pending creation

      //filtered and ordered client side; no way to filter on schemaType or orderByDescending:_Date_Issued on Aries
      //var start = default(int?);
      //if (filter.PaginationEnabled)
      //    start = filter.PageNumber == 1 ? 0 : (filter.PageNumber - 1) * filter.PageSize;

      var items = await _ssiProviderClient.ListCredentials(tenantId);
      if (items == null || items.Count == 0) return result;

      foreach (var item in items)
        result.Items.Add(await ParseCredential<SSICredentialInfo>(item));

      //schemaType filter
      if (filter.SchemaType.HasValue)
        result.Items = result.Items.Where(o => o.SchemaType == filter.SchemaType.Value).ToList();

      result.Items = [.. result.Items.OrderByDescending(o => o.DateIssued).ThenBy(o => o.Id)]; //ensure deterministic sorting / consistent pagination results

      //pagination (client side)
      if (filter.PaginationEnabled)
      {
        result.TotalCount = result.Items.Count;
        result.Items = result.Items.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value).ToList();
      }

      return result;
    }

    private async Task<T> ParseCredential<T>(Models.Provider.Credential item)
        where T : SSICredentialBase, new()
    {
      var schema = await _ssiSchemaService.GetById(item.SchemaId);

      var result = new T
      {
        Id = item.Id,
        ArtifactType = schema.ArtifactType,
        SchemaType = schema.Type,
        DateIssued = DateTimeHelper.TryParse(item.Attributes.SingleOrDefault(o => string.Equals(o.Key, SSISchemaService.SchemaAttribute_Internal_DateIssued, StringComparison.InvariantCultureIgnoreCase)).Value),
      };

      var systemPropertiesSchema = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
          .Where(property => property.System).ToList();

      var systemProperties = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
          .Where(property => property.System && item.Attributes.ContainsKey(property.AttributeName)).ToList();

      var systemPropertiesMismatch = systemPropertiesSchema.Except(systemProperties).ToList();

      if (systemPropertiesMismatch.Count != 0)
        throw new InvalidOperationException($"System properties mismatch detected for credential with id '{item.Id}' and schema '{schema.Name}': " +
            $"Expected based on schema '{string.Join(",", systemPropertiesSchema.Select(o => o.AttributeName)).ToList()}' " +
            $"vs. Credential attributes  '{string.Join(",", systemProperties.Select(o => o.AttributeName)).ToList()}'");

      foreach (var property in systemProperties)
      {
        var attribute = item.Attributes.SingleOrDefault(o => string.Equals(o.Key, property.AttributeName, StringComparison.InvariantCultureIgnoreCase));

        switch (property.SystemType)
        {
          case SchemaEntityPropertySystemType.Title:
            result.Title = ParseCredentialAttributeValue(property, attribute);
            break;

          case SchemaEntityPropertySystemType.Issuer:
            result.Issuer = ParseCredentialAttributeValue(property, attribute);
            break;

          case SchemaEntityPropertySystemType.IssuerLogoURL:
            result.IssuerLogoURL = ParseCredentialAttributeValue(property, attribute);
            break;

          default:
            throw new InvalidOperationException($"System property type '{property.SystemType}' not supported");
        }
      }

      if (typeof(T) == typeof(SSICredentialInfo)) return result;

      result.Attributes = [];

      var additionalProperties = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
          .Where(property => !property.System
          && !SSISchemaService.SchemaAttributes_Internal.Any(i => string.Equals(i, property.AttributeName, StringComparison.InvariantCultureIgnoreCase))
          && item.Attributes.ContainsKey(property.AttributeName)).ToList();

      foreach (var property in additionalProperties)
      {
        var attribute = item.Attributes.SingleOrDefault(o => string.Equals(o.Key, property.AttributeName, StringComparison.InvariantCultureIgnoreCase));
        result.Attributes.Add(new SSICredentialAttribute { Name = property.AttributeName, NameDisplay = property.NameDisplay, ValueDisplay = ParseCredentialAttributeValue(property, attribute) });
      }

      result.Attributes = [.. result.Attributes.OrderBy(o => o.NameDisplay)];
      return result;
    }

    private static string ParseCredentialAttributeValue(SSISchemaEntityProperty property, KeyValuePair<string, string> attribute)
    {
      var result = attribute.Value?.Trim();
      if (string.IsNullOrEmpty(result)) return "n/a";

      if (property.Format == null) return result;

      var type = string.IsNullOrEmpty(property.DotNetType) ? null : Type.GetType(property.DotNetType);
      if (type == null) return result;

      if (type == typeof(string))
        return string.Format(property.Format, attribute.Value);
      else if (type == typeof(DateTimeOffset) || type == typeof(DateTimeOffset?))
      {
        if (!DateTimeOffset.TryParse(attribute.Value, out var value) || value == default) return result;
        return value.ToString(property.Format);
      }
      else if (type == typeof(DateTime) || type == typeof(DateTime?))
      {
        if (!DateTime.TryParse(attribute.Value, out var value) || value == default) return result;
        return value.ToString(property.Format);
      }
      else if (type == typeof(decimal) || type == typeof(decimal?))
      {
        if (!decimal.TryParse(attribute.Value, out var value) || value == default) return result;
        return value.ToString(property.Format);
      }
      else if (type == typeof(float) || type == typeof(float?))
      {
        if (!float.TryParse(attribute.Value, out var value) || value == default) return result;
        return value.ToString(property.Format);
      }
      else
        throw new InvalidOperationException($"Formatting of '{property.Format}' for type '{type}' not supported");
    }
    #endregion
  }
}
