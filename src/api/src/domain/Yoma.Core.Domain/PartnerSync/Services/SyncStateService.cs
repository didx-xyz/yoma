using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class SyncStateService : ISyncStateService
  {
    #region Class Variables
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IProcessingHelperService _processingHelperService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;
    #endregion

    #region Constructor
    public SyncStateService(IProcessingStatusService processingStatusService,
      IProcessingHelperService processingHelperService,
      IRepositoryBatched<ProcessingLog> processingLogRepository)
    {
      _processingStatusService = processingStatusService;
      _processingHelperService = processingHelperService;
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
        _ => throw new InvalidOperationException($"Entity type '{entityType}' not supported")
      };

      var items = query
        .OrderByDescending(o => o.DateModified)
        .ToList()
        .GroupBy(o => new { o.SyncType, o.PartnerId })
        .Select(g => g.First())
        .ToList();

      if (items.Count == 0) return null;

      var syncTypes = items
        .Select(o => Enum.Parse<Core.SyncType>(o.SyncType, true))
        .Distinct()
        .ToList();

      if (syncTypes.Count > 1)
        throw new DataInconsistencyException($"Entity '{entityId}' of type '{entityType}' has mixed synchronization types recorded in processing logs");

      var syncType = syncTypes.Single();

      var partners = items
        .Select(o => o.Partner)
        .Distinct()
        .ToList();

      if (syncType == SyncType.Pull && partners.Count != 1)
        throw new DataInconsistencyException($"Pull synchronization requires exactly one partner for entity '{entityId}' of type '{entityType}'");

      return new SyncInfo
      {
        SyncType = syncType,
        Partners = partners
      };
    }

    public async Task<bool> AbortSyncPushCreateIfPossible(EntityType entityType, Guid entityId)
    {
      var item = _processingHelperService.GetByEntityLatest(SyncType.Push, entityType, entityId);
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
