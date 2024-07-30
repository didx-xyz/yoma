using MediatR;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.PartnerSharing.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Services;

namespace Yoma.Core.Domain.Opportunity.Events
{
  public class OpportunityEventHandler : INotificationHandler<OpportunityEvent>
  {
    #region Class Variables
    private readonly ILogger<OpportunityEventHandler> _logger;
    private readonly ISharingService _sharingService;
    #endregion

    #region Constructor
    public OpportunityEventHandler(ILogger<OpportunityEventHandler> logger, ISharingService sharingService)
    {
      _logger = logger;
      _sharingService = sharingService;
    }
    #endregion

    public async Task Handle(OpportunityEvent notification, CancellationToken cancellationToken)
    {
      try
      {
        _logger.LogInformation("Handling {eventType} event for opportunity with id {entityId}", notification.EventType, notification.Entity.Id);

        switch (notification.EventType)
        {
          case EventType.Create:
            if (!SharingService.Statuses_Opportunity_Creatable.Contains(notification.Entity.Status)) break;
            await _sharingService.ScheduleCreate(PartnerSharing.EntityType.Opportunity, notification.Entity.Id);

            break;

          case EventType.Update:
            if (!SharingService.Statuses_Opportunity_Updatable.Contains(notification.Entity.Status)) break;
            await _sharingService.ScheduleUpdate(PartnerSharing.EntityType.Opportunity, notification.Entity.Id);

            break;

          case EventType.Delete:
            if (!SharingService.Statuses_Opportunity_CanDelete.Contains(notification.Entity.Status)) break;
            await _sharingService.ScheduleDelete(PartnerSharing.EntityType.Opportunity, notification.Entity.Id);

            break;

          default:
            throw new InvalidOperationException($"Event type '{notification.EventType}' is not supported");
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error handling {eventType} event for opportunity with id {entityId}", notification.EventType, notification.Entity.Id);
      }
    }
  }
}
