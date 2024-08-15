using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSharing.Models;

namespace Yoma.Core.Domain.PartnerSharing.Services
{
  public class SharingInfoService : ISharingInfoService
  {
    #region Class Variables
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IProcessingLogHelperService _processingLogHelperService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;
    #endregion

    #region Constructor
    public SharingInfoService(IProcessingStatusService processingStatusService,
      IProcessingLogHelperService processingLogHelperService,
      IRepositoryBatched<ProcessingLog> processingLogRepository)
    {
      _processingStatusService = processingStatusService;
      _processingLogHelperService = processingLogHelperService;
      _processingLogRepository = processingLogRepository;
    }
    #endregion

    #region Public Members
    public async Task<bool> IsShared(EntityType entityType, Guid entityId, bool abortIfPossible)
    {
      var existingItem = _processingLogHelperService.GetByEntity(entityType, entityId);
      if (existingItem == null) return false;

      var action = Enum.Parse<ProcessingAction>(existingItem.Action, true);

      if (action != ProcessingAction.Create) return true;

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
