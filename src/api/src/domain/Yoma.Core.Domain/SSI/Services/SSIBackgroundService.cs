using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSIBackgroundService : ISSIBackgroundService
    {
        #region Class Variables
        private readonly ILogger<SSIBackgroundService> _logger;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly IUserService _userService;
        private readonly IOrganizationService _organizationService;
        private readonly IOpportunityService _opportunityService;
        private readonly IMyOpportunityService _myOpportunityService;
        private readonly ISSISchemaService _ssiSchemaService;

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public SSIBackgroundService(ILogger<SSIBackgroundService> logger,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            ISSIProviderClientFactory ssiProviderClientFactory,
            IUserService userService,
            IOrganizationService organizationService,
            IOpportunityService opportunityService,
            IMyOpportunityService myOpportunityService,
            ISSISchemaService ssiSchemaService)
        {
            _logger = logger;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _userService = userService;
            _organizationService = organizationService;
            _opportunityService = opportunityService;
            _myOpportunityService = myOpportunityService;
            _ssiSchemaService = ssiSchemaService;
        }
        #endregion

        #region Public Members
        public void ProcessTenantCreation()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing SSI tenant creation");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);

                ProcessTenantCreationUser(executeUntil);
                ProcessTenantCreationOrganization(executeUntil);

                _logger.LogInformation("Processed SSI tenant creation");
            }
        }

        public void ProcessCredentialIssuance()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing SSI credential issuance");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);

                ProcessCredentialIssuanceMyOpportunity(executeUntil);

                _logger.LogInformation("Processed SSI credential issuance");
            }
        }
        #endregion

        #region Private Members
        private void ProcessCredentialIssuanceMyOpportunity(DateTime executeUntil)
        {
            while (executeUntil > DateTime.Now)
            {
                var items = _myOpportunityService.ListPendingSSICredentialIssuance(_scheduleJobOptions.SSICredentialIssuanceScheduleBatchSize);
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    try
                    {
                        _logger.LogInformation("Processing SSI credential issuance for 'my' opportunity with id '{id}'", item.Id);

                        if (string.IsNullOrEmpty(item.OpportunitySSISchemaName))
                            throw new InvalidOperationException($"'My' opportunity with id {item.Id} has no associated schema");

                        if (string.IsNullOrEmpty(item.OrganizationSSITenantId))
                            throw new InvalidOperationException($"Organization with id '{item.OrganizationId}' has no associated SSI tenant id");

                        if (string.IsNullOrEmpty(item.UserSSITenantId))
                            throw new InvalidOperationException($"User with id '{item.UserSSITenantId}' has no associated SSI tenant id");

                        var schema = _ssiSchemaService.GetByName(item.OpportunitySSISchemaName).Result;

                        var request = new CredentialIssuanceRequest
                        {
                            SchemaName = schema.Name,
                            ArtifactType = schema.ArtifactType,
                            TenantIdIssuer = item.OrganizationSSITenantId,
                            TenantIdHolder = item.UserSSITenantId,
                            Attributes = new Dictionary<string, string>()
                        };

                        foreach (var entity in schema.Entities)
                        {
                            var entityType = Type.GetType(entity.TypeName);
                            if (entityType == null)
                                throw new InvalidOperationException($"Failed to get the entity of type '{entity.TypeName}'");

                            switch (entityType)
                            {
                                case Type t when t == typeof(User):
                                    var user = _userService.GetById(item.UserId, true, true);
                                    ReflectEntityValues(request, entity, t, user);
                                    break;

                                case Type t when t == typeof(Opportunity.Models.Opportunity):
                                    var opportunity = _opportunityService.GetById(item.OpportunityId, true, true, false);
                                    ReflectEntityValues(request, entity, t, opportunity);
                                    break;

                                case Type t when t == typeof(MyOpportunity.Models.MyOpportunity):
                                    ReflectEntityValues(request, entity, t, item);
                                    break;

                                default:
                                    throw new InvalidOperationException($"Entity of type '{entity.TypeName}' not supported");
                            }
                        }

                        _logger.LogInformation("Processed SSI credential issuance for 'my' opportunity with id '{id}'", item.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to issue SSI credential for 'my' opportunity with id '{id}'", item.Id);
                    }

                    if (executeUntil <= DateTime.Now) break;
                }
            }
        }

        private static void ReflectEntityValues<T>(CredentialIssuanceRequest request, SSISchemaEntity schemaEntity, Type type, T entity)
            where T : class

        {
            if (schemaEntity.Properties == null)
                throw new InvalidOperationException($"Entity properties is null or empty for entity '{schemaEntity.Name}'");

            foreach (var prop in schemaEntity.Properties)
            {
                var propNameParts = prop.Name.Split('.');
                if (!propNameParts.Any() || propNameParts.Length > 2)
                    throw new InvalidOperationException($"Entity '{schemaEntity.Name}' has an property with no name or a multi-part property are more than one level deep");

                var multiPart = propNameParts.Length > 1;

                var propValue = string.Empty;
                var propInfo = type.GetProperty(propNameParts.First())
                    ?? throw new InvalidOperationException($"Entity property '{prop.Name}' not found in entity '{schemaEntity.Name}'");

                var propValueObject = propInfo.GetValue(entity);
                if (prop.Required && propValueObject == null)
                    throw new InvalidOperationException($"Entity property '{prop.Name}' marked as required but is null");

                if (multiPart)
                {
                    var valList = propValueObject as IList
                        ?? throw new InvalidOperationException($"Multi-part property '{prop.Name}''s parent is not of type List<>");

                    var nonNullOrEmptyNames = valList
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
                         .Where(name => !string.IsNullOrEmpty(name)).ToList();

                    propValue = string.Join(", ", nonNullOrEmptyNames);
                }
                else
                    propValue = string.IsNullOrEmpty(propValueObject?.ToString()) ? "n/a" : propValueObject.ToString() ?? "n/a";

                request.Attributes.Add(prop.AttributeName, propValue);
            }
        }

        private void ProcessTenantCreationUser(DateTime executeUntil)
        {
            while (executeUntil > DateTime.Now)
            {
                var items = _userService.ListPendingSSITenantCreation(_scheduleJobOptions.SSITenantCreationScheduleBatchSize);
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    try
                    {
                        _logger.LogInformation("Processing SSI tenant creation for user with id '{id}'", item.Id);

                        var request = new TenantRequest
                        {
                            Referent = item.Id.ToString(),
                            Name = item.DisplayName,
                            ImageUrl = item.PhotoURL,
                            Roles = new List<Models.Role> { Models.Role.Holder }
                        };

                        var tenantId = _ssiProviderClient.EnsureTenant(request).Result;
                        _userService.UpdateSSITenantReference(item.Id, tenantId).Wait();

                        _logger.LogInformation("Processed SSI tenant creation for user with id '{id}'", item.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to created tenant for user with id '{id}'", item.Id);
                    }

                    if (executeUntil <= DateTime.Now) break;
                }
            }
        }

        private void ProcessTenantCreationOrganization(DateTime executeUntil)
        {
            while (executeUntil > DateTime.Now)
            {
                var items = _organizationService.ListPendingSSITenantCreation(_scheduleJobOptions.SSITenantCreationScheduleBatchSize);
                if (!items.Any()) break;

                foreach (var item in items)
                {
                    try
                    {
                        _logger.LogInformation("Processing SSI tenant creation for organization with id '{id}'", item.Id);

                        var request = new TenantRequest
                        {
                            Referent = item.Id.ToString(),
                            Name = item.Name,
                            ImageUrl = item.LogoURL,
                            Roles = new List<Models.Role> { Models.Role.Issuer, Models.Role.Verifier }
                        };

                        var tenantId = _ssiProviderClient.EnsureTenant(request).Result;
                        _organizationService.UpdateSSITenantReference(item.Id, tenantId).Wait();

                        _logger.LogInformation("Processed SSI tenant creation for organization with id '{id}'", item.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to created tenant for organization with id '{id}'", item.Id);
                    }

                    if (executeUntil <= DateTime.Now) break;
                }
            }
        }
        #endregion
    }
}
