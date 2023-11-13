using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Models.Provider;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSIBackgroundService : ISSIBackgroundService
    {
        #region Class Variables
        private readonly ILogger<SSIBackgroundService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ScheduleJobOptions _scheduleJobOptions;
        private readonly IEnvironmentProvider _environmentProvider;
        private readonly IUserService _userService;
        private readonly IOrganizationService _organizationService;
        private readonly IOpportunityService _opportunityService;
        private readonly IMyOpportunityService _myOpportunityService;
        private readonly ISSISchemaService _ssiSchemaService;
        private readonly ISSITenantService _ssiTenantCreationService;
        private readonly ISSICredentialService _ssiCredentialIssuanceService;
        private readonly ISSIProviderClient _ssiProviderClient;

        private static readonly object _lock_Object = new();
        #endregion

        #region Constructor
        public SSIBackgroundService(ILogger<SSIBackgroundService> logger,
            IOptions<AppSettings> appSettings,
            IOptions<ScheduleJobOptions> scheduleJobOptions,
            IEnvironmentProvider environmentProvider,
            IUserService userService,
            IOrganizationService organizationService,
            IOpportunityService opportunityService,
            IMyOpportunityService myOpportunityService,
            ISSISchemaService ssiSchemaService,
            ISSITenantService ssiTenantCreationService,
            ISSICredentialService ssiCredentialIssuanceService,
            ISSIProviderClientFactory ssiProviderClientFactory)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _scheduleJobOptions = scheduleJobOptions.Value;
            _environmentProvider = environmentProvider;
            _userService = userService;
            _organizationService = organizationService;
            _opportunityService = opportunityService;
            _myOpportunityService = myOpportunityService;
            _ssiSchemaService = ssiSchemaService;
            _ssiTenantCreationService = ssiTenantCreationService;
            _ssiCredentialIssuanceService = ssiCredentialIssuanceService;
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
        }
        #endregion

        #region Public Members
        public void SeedSchemas()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                switch (_environmentProvider.Environment) //locally en development only
                {
                    case Core.Environment.Local:
                    case Core.Environment.Development:
                        break;
                    default:
                        _logger.LogInformation("SSI seeding skipped for environment '{environment}'", _environmentProvider.Environment);
                        return;
                }

                _logger.LogInformation("Processing SSI seeding");

                SeedSchema(ArtifactType.Indy, //TODO: Ld_proof
                    SSISSchemaHelper.ToFullName(SchemaType.Opportunity, $"Default"),
                    new List<string> { "Opportunity_OrganizationName", "Opportunity_OrganizationLogoURL", "Opportunity_Title", "Opportunity_Summary", "Opportunity_Type", "Opportunity_Skills",
                        "MyOpportunity_UserDisplayName", "MyOpportunity_UserDateOfBirth", "MyOpportunity_DateCompleted" }).Wait();

                SeedSchema(ArtifactType.Indy,
                    _appSettings.SSISchemaFullNameYoID,
                    new List<string> { "Organization_Name", "Organization_LogoURL", "User_DisplayName", "User_FirstName", "User_Surname", "User_DateOfBirth", "User_Email", "User_Gender", "User_Country" }).Wait();

                _logger.LogInformation("Processed SSI seeding");
            }
        }

        public void ProcessTenantCreation()
        {
            lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
            {
                _logger.LogInformation("Processing SSI tenant creation");

                var executeUntil = DateTime.Now.AddHours(_scheduleJobOptions.SSITenantCreationScheduleMaxIntervalInHours);

                while (executeUntil > DateTime.Now)
                {
                    var items = _ssiTenantCreationService.ListPendingCreationSchedule(_scheduleJobOptions.SSITenantCreationScheduleBatchSize);
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing SSI tenant creation for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);

                            TenantRequest request;
                            var entityType = Enum.Parse<EntityType>(item.EntityType, false);
                            switch (entityType)
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
                                        Roles = new List<Role> { Role.Holder }
                                    };
                                    break;

                                case EntityType.Organization:
                                    if (!item.OrganizationId.HasValue)
                                        throw new InvalidOperationException($"Entity type '{item.EntityType}': Organization id is null");

                                    var org = _organizationService.GetById(item.OrganizationId.Value, false, true, false);

                                    request = new TenantRequest
                                    {
                                        Referent = HashHelper.ComputeSHA256Hash(org.Name), //use hash value of the name; these are published to the trust registry and both the name and label must be unique
                                        Name = org.Name,
                                        ImageUrl = org.LogoURL,
                                        Roles = new List<Role> { Role.Holder, Role.Issuer, Role.Verifier }
                                    };
                                    break;

                                default:
                                    throw new InvalidOperationException($"Entity type '{item.EntityType}' not supported");
                            }

                            item.TenantId = _ssiProviderClient.EnsureTenant(request).Result;
                            item.Status = TenantCreationStatus.Created;
                            _ssiTenantCreationService.UpdateScheduleCreation(item).Wait();

                            _logger.LogInformation("Processed SSI tenant creation for '{entityType}' and item with id '{id}'", item.EntityType, item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to created SSI tenant for '{entityType}'and item with id '{id}''", item.EntityType, item.Id);

                            item.Status = TenantCreationStatus.Error;
                            item.ErrorReason = ex.Message;
                            _ssiTenantCreationService.UpdateScheduleCreation(item).Wait();
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
                    var items = _ssiCredentialIssuanceService.ListPendingIssuanceSchedule(_scheduleJobOptions.SSICredentialIssuanceScheduleBatchSize);
                    if (!items.Any()) break;

                    foreach (var item in items)
                    {
                        try
                        {
                            _logger.LogInformation("Processing SSI credential issuance for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);

                            var schema = _ssiSchemaService.GetByFullName(item.SchemaName).Result;

                            var request = new CredentialIssuanceRequest
                            {
                                ClientReferent = new KeyValuePair<string, string>(SSISchemaService.SchemaAttribute_Internal_ReferentClient, item.Id.ToString()),
                                SchemaType = item.SchemaType.ToString(),
                                SchemaName = item.SchemaName,
                                ArtifactType = item.ArtifactType,
                                Attributes = new Dictionary<string, string>()
                                {
                                    { SSISchemaService.SchemaAttribute_Internal_DateIssued, DateTimeOffset.Now.ToString("yyyy-MM-dd")},
                                    { SSISchemaService.SchemaAttribute_Internal_ReferentClient, item.Id.ToString()}
                                }
                            };

                            User user;
                            (bool proceed, string tenantId) tenantIssuer;
                            (bool proceed, string tenantId) tenantHolder;
                            switch (item.SchemaType)
                            {
                                case SchemaType.YoID:
                                    if (!item.UserId.HasValue)
                                        throw new InvalidOperationException($"Schema type '{item.SchemaType}': 'User id is null");
                                    user = _userService.GetById(item.UserId.Value, true, true);

                                    var organization = _organizationService.GetByNameOrNull(_appSettings.SSIIssuerNameYomaOrganization, true, true);
                                    if (organization == null)
                                    {
                                        _logger.LogInformation("Processing of SSI credential issuance for schema type '{schemaType}' and item with id '{id}' " +
                                            "was skipped as the '{orgName}' organization could not be found", item.SchemaType, item.Id, _appSettings.SSIIssuerNameYomaOrganization);
                                        continue;
                                    }

                                    tenantIssuer = GetTenantId(item, EntityType.Organization, organization.Id);
                                    if (!tenantIssuer.proceed) continue;
                                    request.TenantIdIssuer = tenantIssuer.tenantId;

                                    tenantHolder = GetTenantId(item, EntityType.User, user.Id);
                                    if (!tenantHolder.proceed) continue;
                                    request.TenantIdHolder = tenantHolder.tenantId;

                                    foreach (var entity in schema.Entities)
                                    {
                                        var entityType = Type.GetType(entity.TypeName)
                                            ?? throw new InvalidOperationException($"Failed to get the entity of type '{entity.TypeName}'");

                                        switch (entityType)
                                        {
                                            case Type t when t == typeof(User):
                                                ReflectEntityValues(request, entity, t, user);
                                                break;

                                            case Type t when t == typeof(Organization):
                                                ReflectEntityValues(request, entity, t, organization);
                                                break;

                                            default:
                                                throw new InvalidOperationException($"Entity of type '{entity.TypeName}' not supported");
                                        }
                                    }
                                    break;

                                case SchemaType.Opportunity:
                                    if (!item.MyOpportunityId.HasValue)
                                        throw new InvalidOperationException($"Schema type '{item.SchemaType}': 'My' opportunity id is null");
                                    var myOpportunity = _myOpportunityService.GetById(item.MyOpportunityId.Value, true, true, false);

                                    tenantIssuer = GetTenantId(item, EntityType.Organization, myOpportunity.OrganizationId);
                                    if (!tenantIssuer.proceed) continue;
                                    request.TenantIdIssuer = tenantIssuer.tenantId;

                                    tenantHolder = GetTenantId(item, EntityType.User, myOpportunity.UserId);
                                    if (!tenantHolder.proceed) continue;
                                    request.TenantIdHolder = tenantHolder.tenantId;

                                    foreach (var entity in schema.Entities)
                                    {
                                        var entityType = Type.GetType(entity.TypeName)
                                            ?? throw new InvalidOperationException($"Failed to get the entity of type '{entity.TypeName}'");

                                        switch (entityType)
                                        {
                                            case Type t when t == typeof(Opportunity.Models.Opportunity):
                                                var opportunity = _opportunityService.GetById(myOpportunity.OpportunityId, true, true, false);
                                                ReflectEntityValues(request, entity, t, opportunity);
                                                break;

                                            case Type t when t == typeof(MyOpportunity.Models.MyOpportunity):
                                                ReflectEntityValues(request, entity, t, myOpportunity);
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
                            item.Status = CredentialIssuanceStatus.Issued;
                            _ssiCredentialIssuanceService.UpdateScheduleIssuance(item).Wait();

                            _logger.LogInformation("Processed SSI credential issuance for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to issue SSI credential for schema type '{schemaType}' and item with id '{id}'", item.SchemaType, item.Id);

                            item.Status = CredentialIssuanceStatus.Error;
                            item.ErrorReason = ex.Message;
                            _ssiCredentialIssuanceService.UpdateScheduleIssuance(item).Wait();
                        }

                        if (executeUntil <= DateTime.Now) break;
                    }
                }

                _logger.LogInformation("Processed SSI credential issuance");
            }
        }
        #endregion

        #region Private Members
        private (bool proceed, string tenantId) GetTenantId(SSICredentialIssuance item, EntityType entityType, Guid entityId)
        {
            var tenantIdIssuer = _ssiTenantCreationService.GetTenantIdOrNull(entityType, entityId);
            if (string.IsNullOrEmpty(tenantIdIssuer))
            {
                _logger.LogInformation(
                    "Processing of SSI credential issuance for schema type '{schemaType}' and item with id '{id}' " +
                    "was skipped as the SSI tenant creation for entity of type '{entityType}' and with id '{entityId}' has not been completed", item.SchemaType, item.Id, entityType, entityId);
                return (false, string.Empty);
            }
            return (true, tenantIdIssuer);
        }

        private async Task SeedSchema(ArtifactType artifactType, string schemaFullName, List<string> attributes)
        {
            var schema = await _ssiSchemaService.GetByFullNameOrNull(schemaFullName);
            if (schema == null)
            {
                var (schemaType, displayName) = _ssiSchemaService.SchemaFullNameValidateAndGetParts(schemaFullName);
                await _ssiSchemaService.Create(new SSISchemaRequestCreate
                {
                    TypeId = schemaType.Id,
                    Name = displayName,
                    ArtifactType = artifactType,
                    Attributes = attributes
                });

                return;
            }

            if (schema.ArtifactType != artifactType)
                throw new InvalidOperationException($"Artifact type mismatch detected for existing schema '{schemaFullName}': Requested '{artifactType}' vs. Existing '{schema.ArtifactType}'");

            var misMatchesAttributes = attributes.Where(attr => !schema.Entities.Any(entity => entity.Properties?.Any(property => property.AttributeName == attr) == true)).ToList();
            if (misMatchesAttributes == null || !misMatchesAttributes.Any()) return;

            await _ssiSchemaService.Update(new SSISchemaRequestUpdate
            {
                Name = schema.Name,
                Attributes = attributes
            });
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
        #endregion
    }
}
