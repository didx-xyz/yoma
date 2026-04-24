using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.PartnerSync.Services
{
  public class ProcessingHelperService : IProcessingHelperService
  {
    #region Class Variables
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IRepositoryBatched<ProcessingLog> _processingLogRepository;
    #endregion

    #region Constructor
    public ProcessingHelperService(IProcessingStatusService processingStatusService, IRepositoryBatched<ProcessingLog> processingLogRepository)
    {
      _processingStatusService = processingStatusService;
      _processingLogRepository = processingLogRepository;
    }
    #endregion

    #region Public Members
    public ProcessingLog? GetByEntityLatest(Core.SyncType syncType, EntityType entityType, Guid entityId)
    {
      if (entityId == Guid.Empty)
        throw new ArgumentNullException(nameof(entityId));

      var query = Query(syncType, entityType);

      query = entityType switch
      {
        EntityType.Opportunity => query.Where(o => o.OpportunityId == entityId),
        _ => throw new InvalidOperationException($"Entity type of '{entityType}' not supported"),
      };

      return query.FirstOrDefault();
    }

    public ProcessingLog? GetByEntityLatest(Core.SyncType syncType, Guid partnerId, EntityType entityType, string entityExternalId)
    {
      if (partnerId == Guid.Empty)
        throw new ArgumentNullException(nameof(partnerId));

      if (string.IsNullOrWhiteSpace(entityExternalId))
        throw new ArgumentNullException(nameof(entityExternalId));
      entityExternalId = entityExternalId.Trim();

      var query = Query(syncType, entityType)
        .Where(o => o.PartnerId == partnerId && o.EntityExternalId == entityExternalId);

      return query.FirstOrDefault();
    }
    #endregion

    #region Private Members
    private IQueryable<ProcessingLog> Query(Core.SyncType syncType, EntityType entityType)
    {
      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;

      return _processingLogRepository.Query()
        .Where(o => o.SyncType == syncType.ToString() && o.EntityType == entityType.ToString() && o.StatusId != statusAbortedId) // ignore aborted
        .OrderByDescending(o => o.DateModified);
    }
    #endregion
  }
}
