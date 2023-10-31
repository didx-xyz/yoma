using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;

namespace Yoma.Core.Domain.SSI.Services
{
    public class SSIWalletCreationService : ISSIWalletCreationService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ISSIWalletCreationStatusService _ssiWalletCreationStatusService;
        private readonly IRepository<SSIWalletCreation> _ssiWalletCreationRepository;
        #endregion

        #region Constructor
        public SSIWalletCreationService(IOptions<AppSettings> appSettings,
            ISSIWalletCreationStatusService ssiWalletCreationStatusService,
            IRepository<SSIWalletCreation> ssiWalletCreationRepository)
        {
            _appSettings = appSettings.Value;
            _ssiWalletCreationStatusService = ssiWalletCreationStatusService;
            _ssiWalletCreationRepository = ssiWalletCreationRepository;
        }
        #endregion

        #region Public Members
        public string? GetWalletIdNull(EntityType entityType, Guid entityId)
        {
            if (entityId == Guid.Empty)
                throw new ArgumentNullException(nameof(entityId));

            var statusCreatedId = _ssiWalletCreationStatusService.GetByName(WalletCreationStatus.Created.ToString()).Id;

            SSIWalletCreation? result = null;
            switch (entityType)
            {
                case EntityType.User:
                    result = _ssiWalletCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.UserId == entityId && o.StatusId == statusCreatedId);
                    break;
                case EntityType.Organization:
                    result = _ssiWalletCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.OrganizationId == entityId && o.StatusId == statusCreatedId);
                    break;

                default:
                    throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
            }

            return result?.WalletId;
        }

        public async Task Create(EntityType entityType, Guid entityId)
        {
            if (entityId == Guid.Empty)
                throw new ArgumentNullException(nameof(entityId));

            var statusPendingId = _ssiWalletCreationStatusService.GetByName(WalletCreationStatus.Pending.ToString()).Id;

            SSIWalletCreation? existingItem = null;
            var item = new SSIWalletCreation { StatusId = statusPendingId };

            switch (entityType)
            {
                case EntityType.User:
                    existingItem = _ssiWalletCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.UserId == entityId);
                    item.UserId = entityId;
                    break;
                case EntityType.Organization:
                    existingItem = _ssiWalletCreationRepository.Query().SingleOrDefault(o => o.EntityType == entityType && o.OrganizationId == entityId);
                    item.OrganizationId = entityId;
                    break;

                default:
                    throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
            }

            if (existingItem != null)
                throw new InvalidOperationException($"Wallet creation item already exists for entity type '{entityType}' and entity id '{entityId}'");

            await _ssiWalletCreationRepository.Create(item);
        }

        public List<SSIWalletCreation> ListPendingCreation(int batchSize)
        {
            var statusPendingId = _ssiWalletCreationStatusService.GetByName(WalletCreationStatus.Pending.ToString()).Id;

            var results = _ssiWalletCreationRepository.Query().Where(o => o.StatusId == statusPendingId).OrderBy(o => o.DateModified).Take(batchSize).ToList();

            return results;
        }

        public async Task Update(SSIWalletCreation item)
        {
            if (item == null)
                throw new ArgumentNullException(nameof(item));

            item.WalletId = item.WalletId?.Trim();
            item.ErrorReason = item.ErrorReason?.Trim();

            var statusId = _ssiWalletCreationStatusService.GetByName(item.Status.ToString()).Id;
            item.StatusId = statusId;

            switch (item.Status)
            {
                case WalletCreationStatus.Created:
                    if (string.IsNullOrEmpty(item.WalletId))
                        throw new ArgumentNullException(nameof(item), "Wallet id required");
                    item.ErrorReason = null;
                    break;

                case WalletCreationStatus.Error:
                    if (string.IsNullOrEmpty(item.ErrorReason))
                        throw new ArgumentNullException(nameof(item), "Error reason required");

                    item.RetryCount++;
                    if (item.RetryCount == _appSettings.SSIMaximumRetryAttempts) break; //max retry count reached
                    item.StatusId = _ssiWalletCreationStatusService.GetByName(WalletCreationStatus.Pending.ToString()).Id;
                    break;

                default:
                    throw new InvalidOperationException($"Status of '{item.Status}' not supported");
            }

            await _ssiWalletCreationRepository.Update(item);
        }
        #endregion
    }
}
