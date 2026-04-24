using MediatR;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Events;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Services;

namespace Yoma.Core.Domain.PartnerSync.Events
{
  public class OpportunityEventHandler : INotificationHandler<OpportunityEvent>
  {
    #region Class Variables
    private readonly ILogger<OpportunityEventHandler> _logger;
    private readonly IProcessingService _processingService;
    #endregion

    #region Constructor
    public OpportunityEventHandler(ILogger<OpportunityEventHandler> logger, IProcessingService processingService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _processingService = processingService ?? throw new ArgumentNullException(nameof(processingService));
    }
    #endregion

    #region Public Members
    public async Task Handle(OpportunityEvent notification, CancellationToken cancellationToken)
    {
      try
      {
        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling {eventType} event for opportunity with id {entityId}", notification.EventType, notification.Entity.Id);

        switch (notification.EventType)
        {
          case EventType.Create:
            //only scheduled for active opportunities
            if (!ProcessingService.Statuses_Opportunity_Creatable.Contains(notification.Entity.Status))
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push creation skipped for opportunity with id {id} and status {status}", notification.Entity.Id, notification.Entity.Status.ToDescription());
              break;
            }

            //provide organization is active
            if (notification.Entity.OrganizationStatus != Entity.OrganizationStatus.Active)
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push creation skipped for opportunity with id {id} and status {status}: Organization status {orgStatus}", notification.Entity.Id, notification.Entity.Status.ToDescription(), notification.Entity.OrganizationStatus);
              break;
            }

            await _processingService.ScheduleCreatePush(EntityType.Opportunity, notification.Entity.Id);

            break;

          case EventType.Update:
            if (!ProcessingService.Statuses_Opportunity_Updatable.Contains(notification.Entity.Status))
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push update skipped for opportunity with id {id} and status {status}", notification.Entity.Id, notification.Entity.Status.ToDescription());
              break;
            }

            await _processingService.ScheduleUpdatePush(EntityType.Opportunity, notification.Entity.Id,
              notification.Entity.OrganizationStatus == Entity.OrganizationStatus.Active && notification.Entity.Status == Status.Active);

            break;

          case EventType.Delete:
            if (!ProcessingService.Statuses_Opportunity_CanDelete.Contains(notification.Entity.Status))
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Scheduling of partner sync push deletion skipped for opportunity with id {id} and status {status}", notification.Entity.Id, notification.Entity.Status.ToDescription());
              break;
            }

            switch (notification.Entity.Status)
            {
              case Status.Active:
              case Status.Inactive:
              case Status.Expired:
                if (notification.Entity.OrganizationStatus != Entity.OrganizationStatus.Deleted)
                  throw new InvalidOperationException($"Event {notification.EventType}: Opportunity with status {notification.Entity.Status.ToDescription()} must be associated with a deleted organization");
                break;

              case Status.Deleted:
                break;

              default:
                throw new InvalidOperationException($"{nameof(Status)} of '{notification.Entity.Status.ToDescription()}' not supported");
            }

            await _processingService.ScheduleDeletePush(EntityType.Opportunity, notification.Entity.Id);

            break;

          default:
            throw new InvalidOperationException($"Event type '{notification.EventType}' is not supported");
        }
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Error handling {eventType} event for opportunity with id {entityId}: {errorMessage}", notification.EventType, notification.Entity.Id, ex.Message);
      }
    }
    #endregion
  }
}
