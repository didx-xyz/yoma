using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSharing.Models;

namespace Yoma.Core.Domain.PartnerSharing.Services
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
    public ProcessingLog? GetByEntity(EntityType entityType, Guid entityId)
    {
      var statusAbortedId = _processingStatusService.GetByName(ProcessingStatus.Aborted.ToString()).Id;
      var query = _processingLogRepository.Query().Where(o => o.EntityType == entityType.ToString() && o.StatusId != statusAbortedId); // Ignore status aborted

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
