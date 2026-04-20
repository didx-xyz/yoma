using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class ProcessingLogHelperService : IProcessingLogHelperService
  {
    #region Class Variables
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;
    #endregion

    #region Constructor
    public ProcessingLogHelperService(IProcessingStatusService processingStatusService, IRepositoryBatched<ProcessingLog> processingLogRepository)
    {
      _processingStatusService = processingStatusService;
      _processingLogRepository = processingLogRepository;
    }
    #endregion

    #region Public Members
    //TODO: Add latest-log lookup by sync type, partner, entity type and external id for pull processing
    public ProcessingLog? GetByEntity(SyncType syncType, EntityType entityType, Guid entityId)
    {
      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
      var query = _processingLogRepository.Query().Where(o => o.SyncType == syncType.ToString() && o.EntityType == entityType.ToString() && o.StatusId != statusAbortedId); // Ignore status aborted

      query = entityType switch
      {
        EntityType.Opportunity => query.Where(o => o.OpportunityId == entityId),
        _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported"),
      };

      query = query.OrderByDescending(o => o.DateModified);
      return query.FirstOrDefault();
    }
    #endregion
  }
}
