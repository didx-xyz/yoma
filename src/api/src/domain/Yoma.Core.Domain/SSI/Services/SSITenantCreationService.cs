using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSITenantCreationService : ISSITenantCreationService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ISSITenantCreationStatusService _ssiTenantCreationStatusService;
        private readonly IRepository<SSITenantCreation> _ssiTenantCreationRepository;
        #endregion

        #region Constructor
        public SSITenantCreationService(IOptions<AppSettings> appSettings,
            ISSITenantCreationStatusService ssiTenantCreationStatusService,
            IRepository<SSITenantCreation> ssiTenantCreationRepository)
        {
            _appSettings = appSettings.Value;
            _ssiTenantCreationStatusService = ssiTenantCreationStatusService;
            _ssiTenantCreationRepository = ssiTenantCreationRepository;
        }
        #endregion

        #region Public Members
        public string? GetTenantIdOrNull(EntityType entityType, Guid entityId)
        {
            if (entityId == Guid.Empty)
                throw new ArgumentNullException(nameof(entityId));

            var statusCreatedId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Created.ToString()).Id;

            SSITenantCreation? result = null;
            switch (entityType)
            {
                case EntityType.User:
                    result = _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.UserId == entityId && o.StatusId == statusCreatedId);
                    break;
                case EntityType.Organization:
                    result = _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.OrganizationId == entityId && o.StatusId == statusCreatedId);
                    break;

                default:
                    throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
            }

            return result?.TenantId;
        }

        public async Task Create(EntityType entityType, Guid entityId)
        {
            if (entityId == Guid.Empty)
                throw new ArgumentNullException(nameof(entityId));

            var statusPendingId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;

            SSITenantCreation? existingItem = null;
            var item = new SSITenantCreation { StatusId = statusPendingId };

            switch (entityType)
            {
                case EntityType.User:
                    existingItem = _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.UserId == entityId);
                    item.UserId = entityId;
                    break;
                case EntityType.Organization:
                    existingItem = _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.OrganizationId == entityId);
                    item.OrganizationId = entityId;
                    break;

                default:
                    throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
            }

            if (existingItem != null)
                throw new InvalidOperationException($"Tenant creation item already exists for entity type '{entityType}' and entity id '{entityId}'");

            await _ssiTenantCreationRepository.Create(item);
        }

        public List<SSITenantCreation> ListPendingCreation(int batchSize)
        {
            var statusPendingId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;

            var results = _ssiTenantCreationRepository.Query().Where(o => o.StatusId == statusPendingId).OrderBy(o => o.DateModified).Take(batchSize).ToList();

            return results;
        }

        public async Task Update(SSITenantCreation item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            item.TenantId = item.TenantId?.Trim();
            item.ErrorReason = item.ErrorReason?.Trim();

            var statusId = _ssiTenantCreationStatusService.GetByName(item.Status.ToString()).Id;
            item.StatusId = statusId;

            switch (item.Status)
            {
                case TenantCreationStatus.Created:
                    if (string.IsNullOrEmpty(item.TenantId))
                        throw new ArgumentNullException(nameof(item), "Tenant id required");
                    item.ErrorReason = null;
                    break;

                case TenantCreationStatus.Error:
                    if (string.IsNullOrEmpty(item.ErrorReason))
                        throw new ArgumentNullException(nameof(item), "Error reason required");

                    item.RetryCount++;
                    if (item.RetryCount == _appSettings.SSIMaximumRetryAttempts) break; //max retry count reached
                    item.StatusId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;
                    break;

                default:
                    throw new InvalidOperationException($"Status of '{item.Status}' not supported");
            }

            await _ssiTenantCreationRepository.Update(item);
        }
        #endregion
    }
}
