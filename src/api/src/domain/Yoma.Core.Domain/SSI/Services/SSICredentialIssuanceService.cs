using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSICredentialIssuanceService : ISSICredentialIssuanceService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ISSISchemaService _ssiSchemaService;
        private readonly ISSICredentialIssuanceStatusService _ssiCredentialIssuanceStatusService;
        private readonly IRepository<SSICredentialIssuance> _ssiCredentialIssuanceRepository;
        #endregion

        #region Constructor
        public SSICredentialIssuanceService(IOptions<AppSettings> appSettings,
            ISSISchemaService ssiSchemaService,
            ISSICredentialIssuanceStatusService ssiCredentialIssuanceStatusService,
            IRepository<SSICredentialIssuance> ssiCredentialIssuanceRepository)
        {
            _appSettings = appSettings.Value;
            _ssiSchemaService = ssiSchemaService;
            _ssiCredentialIssuanceStatusService = ssiCredentialIssuanceStatusService;
            _ssiCredentialIssuanceRepository = ssiCredentialIssuanceRepository;
        }
        #endregion

        #region Public Members
        public async Task Create(string schemaName, Guid entityId)
        {
            var schema = await _ssiSchemaService.GetByName(schemaName);

            if(entityId == Guid.Empty)
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

            switch(item.SchemaType)
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

        public List<SSICredentialIssuance> ListPendingIssuance(int batchSize)
        {
            var credentialIssuanceStatusPendingId = _ssiCredentialIssuanceStatusService.GetByName(CredentialIssuanceStatus.Pending.ToString()).Id;

            // issuance skipped if tenants were not created (see SSIBackgroundService)
            var results = _ssiCredentialIssuanceRepository.Query().Where(o => o.StatusId == credentialIssuanceStatusPendingId).OrderBy(o => o.DateModified).Take(batchSize).ToList();

            return results;
        }

        public async Task Update(SSICredentialIssuance item)
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

                    item.RetryCount++;
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

