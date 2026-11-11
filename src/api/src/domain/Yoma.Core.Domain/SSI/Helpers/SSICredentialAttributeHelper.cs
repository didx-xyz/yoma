using Newtonsoft.Json;
using System.Collections;
using System.Globalization;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Helpers
{
  public static class SSICredentialAttributeHelper
  {
    #region Public Members
    public static void ReflectEntityValues<T>(CredentialIssuanceRequest request, SSISchemaEntity schemaEntity, Type type, T entity,
      ICustomFieldDefinitionService customFieldDefinitionService, ICustomFieldValueService customFieldValueService)
      where T : class
    {
      foreach (var prop in schemaEntity.Properties ?? [])
      {
        var propNameParts = prop.Name.Split('.');
        if (propNameParts.Length == 0 || propNameParts.Length > 2)
          throw new InvalidOperationException($"Entity '{schemaEntity.Name}' has an property with no name or a multi-part property are more than one level deep");

        var multiPart = propNameParts.Length > 1;

        var propValue = string.Empty;
        var propInfo = type.GetProperty(propNameParts.First())
            ?? throw new InvalidOperationException($"Entity property '{prop.Name}' not found in entity '{schemaEntity.Name}'");

        var propValueObject = propInfo.GetValue(entity);
        if (prop.Required && propValueObject == null)
          throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but is null");
        if (propValueObject == null)
        {
          MapOptionalCredentialAttributeWithoutValue(request, prop.AttributeName);
          continue;
        }

        if (multiPart)
        {
          var valList = propValueObject as IList
              ?? throw new InvalidOperationException($"Multi-part property '{prop.Name}''s parent is not of type List<>");

          if (prop.Required && valList.Count == 0)
            throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but is an empty list");

          var items = valList
               .Cast<object>()
               .Where(item => item != null)
               .Select(item =>
               {
                 var skillType = item.GetType();
                 var nameProperty = skillType.GetProperty(propNameParts.Last());
                 if (nameProperty != null)
                 {
                   return nameProperty.GetValue(item)?.ToString();
                 }
                 return null;
               })
                .Select(name => name?.Trim())
                .Where(name => !string.IsNullOrEmpty(name))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(name => new SSICredentialAttributeItem { Name = name! })
               .ToList();

          if (prop.Required && items.Count == 0)
            throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but contains no values");
          if (items.Count == 0)
          {
            MapOptionalCredentialAttributeWithoutValue(request, prop.AttributeName);
            continue;
          }

          // Complex properties are stored as JSON within the provider's string attribute contract. Wallet rendering
          // normalizes both this representation and historical comma-delimited values into the same display contract.
          propValue = JsonConvert.SerializeObject(items);
        }
        else if (propValueObject is Enum flags && flags.GetType().IsDefined(typeof(FlagsAttribute), false))
        {
          // Keep the domain's combined flags value, but use the existing signed list contract
          // for credential presentation. None has no selected items and follows optionality.
          var items = flags.GetFlags()
            .Select(flag => new SSICredentialAttributeItem { Name = flag.ToDescription() })
            .ToList();

          if (items.Count == 0)
          {
            if (prop.Required)
              throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but has no selected flags");
            MapOptionalCredentialAttributeWithoutValue(request, prop.AttributeName);
            continue;
          }

          propValue = JsonConvert.SerializeObject(items);
        }
        else
        {
          // New credentials use culture-independent values. Wallet retrieval retains a current-culture fallback for
          // credentials issued before this normalization, when DateTime values were serialized by the API host culture.
          propValue = propValueObject switch
          {
            DateTimeOffset value => value.ToString("O", CultureInfo.InvariantCulture),
            DateTime value => value.ToString("O", CultureInfo.InvariantCulture),
            IFormattable value => value.ToString(null, CultureInfo.InvariantCulture),
            _ => propValueObject.ToString()
          };
          propValue = propValue?.Trim();
          if (string.IsNullOrEmpty(propValue))
          {
            if (prop.Required)
              throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but has no value");
            MapOptionalCredentialAttributeWithoutValue(request, prop.AttributeName);
            continue;
          }
        }

        request.Attributes.Add(prop.AttributeName, propValue);
      }

      MapCustomFieldValues(request, schemaEntity, entity, customFieldDefinitionService, customFieldValueService);
    }

    #endregion

    #region Private Members
    /// <summary>
    /// Maps dynamic custom fields by stable definition keys without CLR reflection.
    /// </summary>
    private static void MapCustomFieldValues<T>(CredentialIssuanceRequest request, SSISchemaEntity schemaEntity, T entity,
      ICustomFieldDefinitionService customFieldDefinitionService, ICustomFieldValueService customFieldValueService)
      where T : class
    {
      if (schemaEntity.CustomFields == null || schemaEntity.CustomFields.Count == 0) return;

      if (!Enum.TryParse<CustomFieldEntityType>(schemaEntity.Name, true, out var entityType))
        throw new InvalidOperationException($"Schema entity '{schemaEntity.Name}' does not support custom fields");

      var values = entity switch
      {
        Opportunity.Models.Opportunity opportunity => opportunity.CustomFields,
        MyOpportunity.Models.MyOpportunity myOpportunity => myOpportunity.CustomFields,
        _ => throw new InvalidOperationException($"Entity '{schemaEntity.Name}' does not support custom fields")
      };

      foreach (var customField in schemaEntity.CustomFields)
      {
        var definition = customFieldDefinitionService.GetByKey(entityType, customField.Key, true, false);
        var value = values?.SingleOrDefault(item => string.Equals(item.Key, customField.Key, StringComparison.OrdinalIgnoreCase));
        var valuesDisplay = value == null ? [] : customFieldValueService.ResolveDisplayValues(definition, value);

        if (customField.Required && valuesDisplay.Count == 0)
          throw new InvalidOperationException($"Custom field '{customField.Key}' marked as required but has no value");
        if (valuesDisplay.Count == 0)
        {
          MapOptionalCredentialAttributeWithoutValue(request, customField.AttributeName);
          continue;
        }

        // Custom-field credentials are new, so multi-select values use the structured provider representation from
        // inception. JWS and SD-JWT omit optional fields without values; ACR supplies its required placeholder.
        request.Attributes.Add(customField.AttributeName, valuesDisplay.Count switch
        {
          _ when customField.SupportsMultiple == true => JsonConvert.SerializeObject(
            valuesDisplay.Select(name => new SSICredentialAttributeItem { Name = name })),
          _ => valuesDisplay.Single()
        });
      }
    }

    /// <summary>
    /// JWS and SD-JWT payloads can omit an optional schema attribute. AnonCreds definitions cannot, so ACR uses the
    /// established "n/a" placeholder while preserving the domain-level distinction that the value is optional.
    /// </summary>
    private static void MapOptionalCredentialAttributeWithoutValue(CredentialIssuanceRequest request, string attributeName)
    {
      switch (request.ArtifactType)
      {
        case ArtifactType.JWS:
        case ArtifactType.SDJWT:
          return;

        case ArtifactType.ACR:
          request.Attributes.Add(attributeName, "n/a");
          return;

        default:
          throw new InvalidOperationException($"Artifact type '{request.ArtifactType}' not supported");
      }
    }
    #endregion
  }
}
