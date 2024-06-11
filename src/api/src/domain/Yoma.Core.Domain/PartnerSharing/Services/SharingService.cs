using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSharing.Models;

namespace Yoma.Core.Domain.PartnerSharing.Services
{
  public class SharingService : ISharingService
  {
    #region Class Variables
    private readonly ILogger<SharingService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IPartnerService _partnerService;
    private readonly IProcessingStatusService _processingStatusService;
    private readonly IRepository<Models.ProcessingLog> _processingLogRepository;
    #endregion

    #region Constructor
    public SharingService(ILogger<SharingService> logger,
       IOptions<AppSettings> appSettings,
       IPartnerService partnerService,
       IProcessingStatusService processingStatusService,
       IRepository<Models.ProcessingLog> processingLogRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _partnerService = partnerService;
      _processingStatusService = processingStatusService;
      _processingLogRepository = processingLogRepository;
    }
    #endregion

    #region Public Members
    public Task ScheduleCreate(EntityType entityType, Guid entityId)
    {
      throw new NotImplementedException();
    }
    public Task ScheduleUpdate(EntityType entityType, Guid entityId)
    {
      throw new NotImplementedException();
    }

    public Task ScheduleDelete(EntityType entityType, Guid entityId)
    {
      throw new NotImplementedException();
    }

    public List<ProcessingLog> ListPendingSchedule(int batchSize, List<Guid> idsToSkip)
    {
      throw new NotImplementedException();
    }

    public Task UpdateSchedule(ProcessingLog item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
