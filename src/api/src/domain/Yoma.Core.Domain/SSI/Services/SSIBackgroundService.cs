using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
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
        private readonly IUserService _userService;
        private readonly IOrganizationService _organizationService;
        private readonly IOpportunityService _opportunityService;
        private readonly IMyOpportunityService _myOpportunityService;
        private readonly ISSISchemaService _ssiSchemaService;
        private readonly ISSIWalletCreationService _ssiWalletCreationService;
        private readonly ISSICredentialIssuanceService _ssiCredentialIssuanceService;
        private readonly ISSIProviderClient _ssiProviderClient;

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public SSIBackgroundService(ILogger<SSIBackgroundService> logger,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IUserService userService,
            IOrganizationService organizationService,
            ISSISchemaService ssiSchemaService,
            ISSIWalletCreationService ssiWalletCreationService,
            ISSICredentialIssuanceService ssiCredentialIssuanceService,
            ISSIProviderClientFactory ssiProviderClientFactory)
        {
            _logger = logger;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _userService = userService;
            _organizationService = organizationService;
            _ssiSchemaService = ssiSchemaService;
            _ssiWalletCreationService = ssiWalletCreationService;
            _ssiCredentialIssuanceService = ssiCredentialIssuanceService;
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
        }
        #endregion

        #region Public Members
        public void ProcessTenantCreation()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing SSI tenant creation");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);

                while (executeUntil > DateTime.Now)
                {
                    var items = _ssiWalletCreationService.ListPendingCreation(_scheduleJobOptions.SSITenantCreationScheduleBatchSize);
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing SSI tenant creation for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);

                            TenantRequest request;
                            switch (item.EntityType)
                            {
                                case EntityType.User:
                                    if (!item.UserId.HasValue)
                                        throw new InvalidOperationException($"Entity type '{item.EntityType}': User id is null");

                                    var user = _userService.GetById(item.UserId.Value, false, true);

                                    request = new TenantRequest
                                    {
                                        Referent = user.Id.ToString(),
                                        Name = user.DisplayName,
                                        ImageUrl = user.PhotoURL,
                                        Roles = new List<Models.Role> { Models.Role.Holder }
                                    };
                                    break;

                                case EntityType.Organization:
                                    if (!item.OrganizationId.HasValue)
                                        throw new InvalidOperationException($"Entity type '{item.EntityType}': Organization id is null");

                                    var org = _organizationService.GetById(item.OrganizationId.Value, false, true, false);

                                    request = new TenantRequest
                                    {
                                        Referent = org.Id.ToString(),
                                        Name = org.Name,
                                        ImageUrl = org.LogoURL,
                                        Roles = new List<Models.Role> { Models.Role.Holder, Models.Role.Issuer, Models.Role.Verifier }
                                    };
                                    break;

                                default:
                                    throw new InvalidOperationException($"Entity type '{item.EntityType}' not supported");
                            }

                            item.WalletId = _ssiProviderClient.EnsureTenant(request).Result;
                            _ssiWalletCreationService.Update(item).Wait();

                            _logger.LogInformation("Processed SSI tenant creation for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to created SSI tenant for '{entityType}'and item with id '{id}''", item.EntityType, item.Id);

                            item.Status = Models.WalletCreationStatus.Error;
                            item.ErrorReason = ex.Message;
                            _ssiWalletCreationService.Update(item).Wait();
                        }

                        if (executeUntil <= DateTime.Now) break;
                    }
                }

                _logger.LogInformation("Processed SSI tenant creation");
            }
        }

        public void ProcessCredentialIssuance()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing SSI credential issuance");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);

                while (executeUntil > DateTime.Now)
                {
                    var items = _ssiCredentialIssuanceService.ListPendingIssuance(_scheduleJobOptions.SSICredentialIssuanceScheduleBatchSize);
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing SSI credential issuance for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);

                            var schema = _ssiSchemaService.GetByName(item.SchemaName).Result;

                            var request = new CredentialIssuanceRequest
                            {
                                SchemaName = item.SchemaName,
                                ArtifactType = item.ArtifactType,
                                Attributes = new Dictionary<string, string>()
                            };

                            switch (item.SchemaType)
                            {
                                case Models.SchemaType.Opportunity:
                                    if (!item.MyOpportunityId.HasValue)
                                        throw new InvalidOperationException($"Schema type '{item.SchemaType}': 'My' opportunity id is null");
                                    var myOpportunityInfo = _myOpportunityService.GetById(item.MyOpportunityId.Value, false, false);

                                    var walletIdIssuer = _ssiWalletCreationService.GetWalletIdNull(EntityType.Organization, myOpportunityInfo.OrganizationId);
                                    if (string.IsNullOrEmpty(walletIdIssuer))
                                    {
                                        _logger.LogInformation("Processing of SSI credential issuance for schema type '{schemaType}' and item with ID '{id}' was skipped as the SSI issuer wallet creation has not been completed", item.SchemaType, item.Id);
                                        continue;
                                    }
                                    request.TenantIdIssuer = walletIdIssuer;

                                    var walletIdHolder = _ssiWalletCreationService.GetWalletIdNull(EntityType.User, myOpportunityInfo.UserId);
                                    if (string.IsNullOrEmpty(walletIdHolder))
                                    {
                                        _logger.LogInformation("Processing of SSI credential issuance for schema type '{schemaType}' and item with ID '{id}' was skipped as the SSI holder wallet creation has not been completed", item.SchemaType, item.Id);
                                        continue;
                                    }
                                    request.TenantIdHolder = walletIdHolder;

                                    foreach (var entity in schema.Entities)
                                    {
                                        var entityType = Type.GetType(entity.TypeName)
                                            ?? throw new InvalidOperationException($"Failed to get the entity of type '{entity.TypeName}'");

                                        switch (entityType)
                                        {
                                            case Type t when t == typeof(User):
                                                var user = _userService.GetById(myOpportunityInfo.UserId, true, true);
                                                ReflectEntityValues(request, entity, t, user);
                                                break;

                                            case Type t when t == typeof(Opportunity.Models.Opportunity):
                                                var opportunity = _opportunityService.GetById(myOpportunityInfo.OpportunityId, true, true, false);
                                                ReflectEntityValues(request, entity, t, opportunity);
                                                break;

                                            case Type t when t == typeof(MyOpportunity.Models.MyOpportunityInfo):
                                                ReflectEntityValues(request, entity, t, myOpportunityInfo);
                                                break;

                                            default:
                                                throw new InvalidOperationException($"Entity of type '{entity.TypeName}' not supported");
                                        }
                                    }
                                    break;

                                default:
                                    throw new InvalidOperationException($"Schema type '{item.SchemaType}' not supported");
                            }

                            item.CredentialId = _ssiProviderClient.IssueCredential(request).Result;
                            _ssiCredentialIssuanceService.Update(item).Wait();

                            _logger.LogInformation("Processed SSI credential issuance for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to issue SSI credential for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);

                            item.Status = Models.CredentialIssuanceStatus.Error;
                            item.ErrorReason = ex.Message;
                            _ssiCredentialIssuanceService.Update(item).Wait();
                        }

                        if (executeUntil <= DateTime.Now) break;
                    }
                }

                _logger.LogInformation("Processed SSI credential issuance");
            }
        }
        #endregion

        #region Private Members
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
        #endregion
    }
}
