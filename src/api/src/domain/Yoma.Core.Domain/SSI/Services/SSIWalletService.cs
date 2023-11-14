using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

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
        #endregion

        #region Constructors
        public SSIWalletService(IHttpContextAccessor httpContextAccessor,
            IUserService userService,
            ISSIProviderClientFactory ssiProviderClientFactory,
            ISSITenantService ssiTenantService,
            ISSISchemaService ssiSchemaService)
        {
            _httpContextAccessor = httpContextAccessor;
            _userService = userService;
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _ssiTenantService = ssiTenantService;
            _ssiSchemaService = ssiSchemaService;
        }
        #endregion

        #region Public Members
        public async Task<SSICredential> GetUserCredentialById(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                throw new ArgumentNullException(nameof(id));
            id = id.Trim();

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);
            var tenantId = _ssiTenantService.GetTenantId(Entity.EntityType.User, user.Id);

            var item = await _ssiProviderClient.GetCredentialById(tenantId, id);

            return await ParseCredential<SSICredential>(item);
        }

        public async Task<SSIWalletSearchResults> SearchUserCredentials(SSIWalletFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

            filter.EntityType = Entity.EntityType.User;
            filter.EntityId = user.Id;

            return await Search(filter);
        }
        #endregion

        #region Private Members
        private async Task<SSIWalletSearchResults> Search(SSIWalletFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            //TODO: validator

            var result = new SSIWalletSearchResults { Items = new List<SSICredentialInfo>() };

            var tenantId = _ssiTenantService.GetTenantIdOrNull(filter.EntityType, filter.EntityId);
            if (string.IsNullOrEmpty(tenantId)) return result; //tenant pending creation

            var items = await _ssiProviderClient.ListCredentials(tenantId, filter.PageNumber, filter.PageSize);
            if (items == null || !items.Any()) return result;

            foreach (var item in items)
                result.Items.Add(await ParseCredential<SSICredentialInfo>(item));

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
                DateIssued = DateTimeHelper.TyrParse(item.Attributes.SingleOrDefault(o => o.Key == SSISchemaService.SchemaAttribute_Internal_DateIssued).Value),
            };

            var systemPropertiesSchema = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
                .Where(property => property.System).ToList();

            var systemProperties = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
                .Where(property => property.System && item.Attributes.ContainsKey(property.AttributeName)).ToList();

            var systemPropertiesMismatch = systemPropertiesSchema.Except(systemProperties).ToList();

            if (systemPropertiesMismatch.Any())
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

            result.Attributes = new List<SSICredentialAttribute>();

            var additionalProperties = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
                .Where(property => !property.System
                && !SSISchemaService.SchemaAttributes_Internal.Any(i => string.Equals(i, property.AttributeName, StringComparison.InvariantCultureIgnoreCase))
                && item.Attributes.ContainsKey(property.AttributeName)).ToList();

            foreach (var property in additionalProperties)
            {
                var attribute = item.Attributes.SingleOrDefault(o => string.Equals(o.Key, property.AttributeName, StringComparison.InvariantCultureIgnoreCase));
                result.Attributes.Add(new SSICredentialAttribute { Name = property.AttributeName, NameDisplay = property.NameDisplay, ValueDisplay = ParseCredentialAttributeValue(property, attribute) });
            }

            result.Attributes = result.Attributes.OrderBy(o => o.NameDisplay).ToList(); 
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
