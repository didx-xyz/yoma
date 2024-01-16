using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSITenantService : ISSITenantService
    {
        #region Class Variables
        private readonly ILogger<SSITenantService> _logger;
        private readonly AppSettings _appSettings;
        private readonly ISSITenantCreationStatusService _ssiTenantCreationStatusService;
        private readonly IRepository<SSITenantCreation> _ssiTenantCreationRepository;
        #endregion

        #region Constructor
        public SSITenantService(ILogger<SSITenantService> logger,
            IOptions<AppSettings> appSettings,
            ISSITenantCreationStatusService ssiTenantCreationStatusService,
            IRepository<SSITenantCreation> ssiTenantCreationRepository)
        {
            _logger = logger;
            _appSettings = appSettings.Value;
            _ssiTenantCreationStatusService = ssiTenantCreationStatusService;
            _ssiTenantCreationRepository = ssiTenantCreationRepository;
        }
        #endregion

        #region Public Members
        public string GetTenantId(EntityType entityType, Guid entityId)
        {
            var result = GetTenantIdOrNull(entityType, entityId);
            if (string.IsNullOrEmpty(result))
                throw new EntityNotFoundException($"Tenant id not found of entity of type '{entityType}' and id '{entityId}'");
            return result;
        }

        public string? GetTenantIdOrNull(EntityType entityType, Guid entityId)
        {
            if (entityId == Guid.Empty)
                throw new ArgumentNullException(nameof(entityId));

            var statusCreatedId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Created.ToString()).Id;

            SSITenantCreation? result = null;
            result = entityType switch
            {
                EntityType.User =>
                    _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType.ToString() && o.UserId == entityId && o.StatusId == statusCreatedId),
                EntityType.Organization =>
                    _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType.ToString() && o.OrganizationId == entityId && o.StatusId == statusCreatedId),
                _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported"),
            };

            if (result != null && string.IsNullOrEmpty(result.TenantId))
                throw new DataInconsistencyException($"Tenant id expected with tenant creation status of 'Created' for item with id '{result.Id}'");

            return result?.TenantId;
        }

        public async Task ScheduleCreation(EntityType entityType, Guid entityId)
        {
            if (entityId == Guid.Empty)
                throw new ArgumentNullException(nameof(entityId));

            var statusPendingId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;

            SSITenantCreation? existingItem = null;
            var item = new SSITenantCreation { EntityType = entityType.ToString(), StatusId = statusPendingId };

            switch (entityType)
            {
                case EntityType.User:
                    existingItem = _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType.ToString() && o.UserId == entityId);
                    item.UserId = entityId;
                    break;
                case EntityType.Organization:
                    existingItem = _ssiTenantCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType.ToString() && o.OrganizationId == entityId);
                    item.OrganizationId = entityId;
                    break;

                default:
                    throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
            }

            if (existingItem != null)
            {
                _logger.LogInformation("Scheduling of tenant creation skipped: Already '{status}' for entity type '{entityType}' and entity id '{entityId}'", existingItem.Status, entityType, entityId);
                return;
            }

            await _ssiTenantCreationRepository.Create(item);
        }

        public List<SSITenantCreation> ListPendingCreationSchedule(int batchSize, List<Guid> idsToSkip)
        {
            if (batchSize <= default(int))
                throw new ArgumentOutOfRangeException(nameof(batchSize));

            var statusPendingId = _ssiTenantCreationStatusService.GetByName(TenantCreationStatus.Pending.ToString()).Id;

            var query = _ssiTenantCreationRepository.Query().Where(o => o.StatusId == statusPendingId);

            if(idsToSkip != null && idsToSkip.Any())
                query = query.Where(o => !idsToSkip.Contains(o.Id));

            var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

            return results;
        }

        public async Task UpdateScheduleCreation(SSITenantCreation item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            item.TenantId = item.TenantId?.Trim();

            var statusId = _ssiTenantCreationStatusService.GetByName(item.Status.ToString()).Id;
            item.StatusId = statusId;

            switch (item.Status)
            {
                case TenantCreationStatus.Created:
                    if (string.IsNullOrEmpty(item.TenantId))
                        throw new ArgumentNullException(nameof(item), "Tenant id required");
                    item.ErrorReason = null;
                    item.RetryCount = null;
                    break;

                case TenantCreationStatus.Error:
                    if (string.IsNullOrEmpty(item.ErrorReason))
                        throw new ArgumentNullException(nameof(item), "Error reason required");

                    item.ErrorReason = item.ErrorReason?.Trim();
                    item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

                    //retry attempts specified and exceeded
                    if (_appSettings.SSIMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.SSIMaximumRetryAttempts) break;

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
