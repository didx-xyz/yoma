using MediatR;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Events;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Entity.Events
{
  public class OrganizationStatusChangedEventHandler : INotificationHandler<OrganizationStatusChangedEvent>
  {
    #region Class Variables
    private readonly ILogger<OrganizationStatusChangedEventHandler> _logger;
    private readonly IOpportunityService _opportunityService;
    private readonly IMediator _mediator;
    #endregion

    #region Constructor
    public OrganizationStatusChangedEventHandler(ILogger<OrganizationStatusChangedEventHandler> logger, IOpportunityService opportunityService, IMediator mediator)
    {
      _logger = logger;
      _opportunityService = opportunityService;
      _mediator = mediator;
    }
    #endregion

    #region Public Members
    public async Task Handle(OrganizationStatusChangedEvent notification, CancellationToken cancellationToken)
    {
      try
      {
        _logger.LogInformation("Handling organization status change event for organization with id {organizationId} and status {organizationStatus}",
          notification.Organization.Id, notification.Organization.Status);

        var filter = new OpportunitySearchFilterAdmin
        {
          Organizations = [notification.Organization.Id],
          PageNumber = 1,
          PageSize = 100
        };

        OpportunitySearchResults? result = null;
        do
        {
          switch (notification.Organization.Status)
          {
            case OrganizationStatus.Active:
            case OrganizationStatus.Inactive:
              //raise update events for all active opportunities
              filter.Statuses = [Status.Active];

              result = _opportunityService.Search(filter, false);
              if (result.Items.Count == 0) return;

              foreach (var item in result.Items)
                await _mediator.Publish(new OpportunityEvent(EventType.Update, item), cancellationToken);

              break;

            case OrganizationStatus.Deleted:
              //raise delete events for all active, inactive and expired opportunities
              filter.Statuses = [Status.Active, Status.Inactive, Status.Expired];

              result = _opportunityService.Search(filter, false);
              if (result.Items.Count == 0) return;

              foreach (var item in result.Items)
                await _mediator.Publish(new OpportunityEvent(EventType.Delete, item), cancellationToken);

              break;

            case OrganizationStatus.Declined:
              return;

            default:
              throw new InvalidOperationException($"Organization status '{notification.Organization.Status}' is not supported");
          }

          filter.PageNumber++;
        }
        while (result.Items.Count != 0);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error handling organization status change event for organization with id {organizationId} and status {organizationStatus}",
          notification.Organization.Id, notification.Organization.Status);
      }
    }
    #endregion
  }
}
