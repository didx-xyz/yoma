using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class SyncInfoService : ISyncInfoService
  {
    #region Class Variables
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IProcessingLogHelperService _processingLogHelperService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;
    #endregion

    #region Constructor
    public SyncInfoService(IProcessingStatusService processingStatusService,
      IProcessingLogHelperService processingLogHelperService,
      IRepositoryBatched<ProcessingLog> processingLogRepository)
    {
      _processingStatusService = processingStatusService;
      _processingLogHelperService = processingLogHelperService;
      _processingLogRepository = processingLogRepository;
    }
    #endregion

    #region Public Members
    public (bool IsSynced, SyncPartner? Partner) IsSynced(SyncType syncType, EntityType entityType, Guid entityId)
    {
      return IsSynced(syncType, entityType, entityId, null);
    }

    public (bool IsSynced, SyncPartner? Partner) IsSynced(SyncType syncType, EntityType entityType, Guid entityId, bool? abortIfPossible)
    {
      return IsSyncedAsync(syncType, entityType, entityId, abortIfPossible).GetAwaiter().GetResult();
    }

    public async Task<(bool IsSynced, Core.SyncPartner? Partner)> IsSyncedAsync(SyncType syncType, EntityType entityType, Guid entityId)
    {
      return await IsSyncedAsync(syncType, entityType, entityId, null);
    }

    public async Task<(bool IsSynced, Core.SyncPartner? Partner)> IsSyncedAsync(SyncType syncType, EntityType entityType, Guid entityId, bool? abortIfPossible)
    {
      if (syncType == SyncType.Pull && abortIfPossible.HasValue)
        throw new InvalidOperationException("Abort is not applicable for pull sync");

      var existingItem = _processingLogHelperService.GetByEntityLatest(syncType, entityType, entityId);
      if (existingItem == null) return (false, null);

      var action = Enum.Parse<SyncAction>(existingItem.Action, true);

      if (action != SyncAction.Create) return (true, existingItem.Partner);
      if (existingItem.Status == ProcessingStatus.Processed) return (true, existingItem.Partner);
      if (syncType == SyncType.Pull) return (true, existingItem.Partner);
      if (abortIfPossible != true) return (true, existingItem.Partner);

      existingItem.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
      existingItem.Status = ProcessingStatus.Aborted;

      await _processingLogRepository.Update(existingItem);

      return (false, existingItem.Partner);
    }
    #endregion
  }
}
