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
    public async Task<bool> IsSynced(SyncType syncType, EntityType entityType, Guid entityId, bool abortIfPossible)
    {
      var existingItem = _processingLogHelperService.GetByEntity(syncType, entityType, entityId);
      if (existingItem == null) return false;

      var action = Enum.Parse<SyncAction>(existingItem.Action, true);

      if (action != SyncAction.Create) return true;

      if (existingItem.Status == ProcessingStatus.Processed) return true;

      if (!abortIfPossible) return true;

      existingItem.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
      existingItem.Status = ProcessingStatus.Aborted;
      await _processingLogRepository.Update(existingItem);

      return false;
    }
    #endregion
  }
}
