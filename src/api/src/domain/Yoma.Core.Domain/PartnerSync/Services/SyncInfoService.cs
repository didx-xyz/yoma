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
    public SyncInfo? ListSyncInfo(EntityType entityType, Guid entityId)
    {
      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;

      var query = _processingLogRepository.Query()
        .Where(o => o.EntityType == entityType.ToString() && o.StatusId != statusAbortedId);

      query = entityType switch
      {
        EntityType.Opportunity => query.Where(o => o.OpportunityId == entityId),
        _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported"),
      };

      var items = query.OrderByDescending(o => o.DateModified).ToList()
        .GroupBy(o => new { o.SyncType, o.PartnerId })
        .Select(g => g.First())
        .ToList();

      if (items.Count == 0) return null;

      return new SyncInfo
      {
        Types =
        [
          .. items
        .GroupBy(o => o.SyncType)
        .Select(g => new SyncInfoType
        {
          SyncType = Enum.Parse<Core.SyncType>(g.Key, true),
          Partners = [.. g.Select(o => o.Partner).Distinct()]
        })
        ]
      };
    }

    public async Task<bool> AbortSyncPushCreateIfPossible(EntityType entityType, Guid entityId)
    {
      var item = _processingLogHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);
      if (item == null) return false;

      var action = Enum.Parse<SyncAction>(item.Action, true);
      if (action != SyncAction.Create) return false;
      if (item.Status == ProcessingStatus.Processed) return false;

      item.StatusId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
      item.Status = ProcessingStatus.Aborted;

      await _processingLogRepository.Update(item);

      return true;
    }
    #endregion
  }
}
