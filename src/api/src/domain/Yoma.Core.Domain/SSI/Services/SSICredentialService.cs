using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSICredentialService : ISSICredentialService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ISSIProviderClient _ssiProviderClient;
        private readonly ISSITenantService _ssiTenantService;
        private readonly ISSISchemaService _ssiSchemaService;
        private readonly ISSICredentialIssuanceStatusService _ssiCredentialIssuanceStatusService;
        private readonly IRepository<SSICredentialIssuance> _ssiCredentialIssuanceRepository;
        #endregion

        #region Constructor
        public SSICredentialService(IOptions<AppSettings> appSettings,
            ISSIProviderClientFactory ssiProviderClientFactory,
            ISSITenantService ssiTenantService,
            ISSISchemaService ssiSchemaService,
            ISSICredentialIssuanceStatusService ssiCredentialIssuanceStatusService,
            IRepository<SSICredentialIssuance> ssiCredentialIssuanceRepository)
        {
            _appSettings = appSettings.Value;
            _ssiProviderClient = ssiProviderClientFactory.CreateClient();
            _ssiTenantService = ssiTenantService;
            _ssiSchemaService = ssiSchemaService;
            _ssiCredentialIssuanceStatusService = ssiCredentialIssuanceStatusService;
            _ssiCredentialIssuanceRepository = ssiCredentialIssuanceRepository;
        }
        #endregion

        #region Public Members
        public async Task<List<Credential>> Search(CredentialFilter filter)
        {
            //TODO: NameDisplay on entity property in DB
            //TODO: ValueDescription >> Description
            //TODO: Optional Format with prefix / suffix capability

            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            var results = new List<Credential>();

            var tenantId = _ssiTenantService.GetTenantIdOrNull(filter.EntityType, filter.EntityId);
            if (string.IsNullOrEmpty(tenantId)) return results; //tenant pending creation

            var items = await _ssiProviderClient.ListCredentials(tenantId);
            if (items == null || !items.Any()) return results;


            foreach (var item in items)
            {
                var schema = await _ssiSchemaService.GetByFullName(item.SchemaId);

                var credential = new Credential
                {
                    Id = item.Id,
                    ArtifactType = schema.ArtifactType,
                    SchemaType = schema.Type,
                    DateIssued = DateTimeHelper.TyrParse(item.Attributes.SingleOrDefault(o => o.Key == SSISchemaService.SchemaAttribute_Internal_DateIssued).Value),
                    Attributes = new List<CredentialAttribute>()
                };

                var itemAttributes = item.Attributes.Where(o => !SSISchemaService.SchemaAttributes_Internal.Any(i => string.Equals(i, o.Key, StringComparison.InvariantCultureIgnoreCase)));

                foreach (var itemAttribute in itemAttributes)
                {
                    var schemaProperty = schema.Entities.SelectMany(entity => entity.Properties ?? Enumerable.Empty<SSISchemaEntityProperty>())
                        .SingleOrDefault(property => property?.AttributeName == itemAttribute.Key);

                    var credAttribute = new CredentialAttribute
                    {
                        Name = itemAttribute.Key,
                        NameDisplay = itemAttribute.Key,
                        ValueDisplay = itemAttribute.Value
                    };
                    credential.Attributes.Add(credAttribute);

                    if (schemaProperty == null || string.IsNullOrEmpty(schemaProperty.DotNetType)) continue; //no schema information; return raw attribute

                    var type = Type.GetType(schemaProperty.DotNetType);
                    if (type == null) continue;

                    if (type == typeof(DateTimeOffset))
                    {
                        if (!DateTimeOffset.TryParse(itemAttribute.Value, out var dateValue) || dateValue == default) continue;
                        credAttribute.ValueDisplay = dateValue.ToString("yyyy-MM-dd");
                    }
                }
            }

            return results;
        }

        public async Task ScheduleIssuance(string schemaName, Guid entityId)
        {
            var schema = await _ssiSchemaService.GetByFullName(schemaName);

            if (entityId == Guid.Empty)
                throw new ArgumentNullException(nameof(entityId));

            var statusPendingId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;

            SSICredentialIssuance? existingItem = null;
            var item = new SSICredentialIssuance
            {
                SchemaTypeId = schema.TypeId,
                ArtifactType = schema.ArtifactType,
                SchemaName = schema.Name,
                SchemaVersion = schema.Version,
                StatusId = statusPendingId
            };

            switch (item.SchemaType)
            {
                case SchemaType.Opportunity:
                    existingItem = _ssiCredentialIssuanceRepository.Query().SingleOrDefault(o => o.SchemaTypeId == item.SchemaTypeId && o.MyOpportunityId == entityId);
                    item.MyOpportunityId = entityId;
                    break;

                case SchemaType.YoID:
                    existingItem = _ssiCredentialIssuanceRepository.Query().SingleOrDefault(o => o.SchemaTypeId == item.SchemaTypeId && o.OrganizationId == entityId);
                    item.UserId = entityId;
                    break;
            }

            if (existingItem != null)
                throw new InvalidOperationException($"Credential issuance item already exists for schema type '{schema.Type}' and entity id '{entityId}'");

            await _ssiCredentialIssuanceRepository.Create(item);
        }

        public List<SSICredentialIssuance> ListPendingIssuanceSchedule(int batchSize)
        {
            var credentialIssuanceStatusPendingId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;

            // issuance skipped if tenants were not created (see SSIBackgroundService)
            var results = _ssiCredentialIssuanceRepository.Query().Where(o => o.StatusId == credentialIssuanceStatusPendingId).OrderBy(o => o.DateModified).Take(batchSize).ToList();

            return results;
        }

        public async Task UpdateScheduleIssuance(SSICredentialIssuance item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            item.CredentialId = item.CredentialId?.Trim();
            item.ErrorReason = item.ErrorReason?.Trim();

            var statusId = _ssiCredentialIssuanceStatusService.GetByName(item.Status.ToString()).Id;
            item.StatusId = statusId;

            switch (item.Status)
            {
                case CredentialIssuanceStatus.Issued:
                    if (string.IsNullOrEmpty(item.CredentialId))
                        throw new ArgumentNullException(nameof(item), "Credential id required");
                    item.ErrorReason = null;
                    break;

                case CredentialIssuanceStatus.Error:
                    if (string.IsNullOrEmpty(item.ErrorReason))
                        throw new ArgumentNullException(nameof(item), "Error reason required");

                    item.RetryCount = (byte?)(item.RetryCount + 1) ?? 1;
                    if (item.RetryCount == _appSettings.SSIMaximumRetryAttempts) break; //max retry count reached
                    item.StatusId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;
                    break;

                default:
                    throw new InvalidOperationException($"Status of '{item.Status}' not supported");
            }

            await _ssiCredentialIssuanceRepository.Update(item);
        }
        #endregion
    }
}

