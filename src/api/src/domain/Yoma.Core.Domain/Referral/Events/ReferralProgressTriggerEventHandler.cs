using MediatR;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Referral.Interfaces;

namespace Yoma.Core.Domain.Referral.Events
{
  public sealed class ReferralProgressTriggerEventHandler : INotificationHandler<ReferralProgressTriggerEvent>
  {
    #region Class Variables
    private readonly ILogger<ReferralProgressTriggerEventHandler> _logger;
    private readonly ILinkUsageService _linkUsageService;
    #endregion

    #region Constructor
    public ReferralProgressTriggerEventHandler(
      ILogger<ReferralProgressTriggerEventHandler> logger,
      ILinkUsageService linkUsageService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _linkUsageService = linkUsageService ?? throw new ArgumentNullException(nameof(linkUsageService));
    }
    #endregion

    #region Public Members
    public async Task Handle(ReferralProgressTriggerEvent notification, CancellationToken cancellationToken)
    {
      try
      {
        switch (notification.Entity.Source)
        {
          case ReferralTriggerSource.IdentityAction:
            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Referral progress: handling identity trigger for user {UserId} ({Username})",
              notification.Entity.UserId,
              notification.Entity.Username);
            break;

          case ReferralTriggerSource.OpportunityCompletion:
            if (!notification.Entity.OpportunityId.HasValue)
              throw new InvalidOperationException("OpportunityId must be provided for OpportunityCompletion source");

            if (string.IsNullOrEmpty(notification.Entity.OpportunityTitle))
              throw new InvalidOperationException("OpportunityTitle must be provided for OpportunityCompletion source");

            if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
              "Referral progress: handling Opportunity trigger for user {UserId} ({Username}) — opportunity {OpportunityId} '{OpportunityTitle}'",
              notification.Entity.UserId,
              notification.Entity.Username,
              notification.Entity.OpportunityId,
              notification.Entity.OpportunityTitle);
            break;

          default:
            throw new InvalidOperationException($"Unsupported referral progress trigger source: {notification.Entity.Source}");
        }

        await _linkUsageService.ProcessProgressByUserId(notification.Entity.UserId);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex,
          "Referral progress: failed processing {Source} trigger for user {UserId} ({Username}) — error: {ErrorMessage}",
          notification.Entity.Source.ToString(),
          notification.Entity.UserId,
          notification.Entity.Username,
          ex.Message);
      }
    }
    #endregion
  }
}
