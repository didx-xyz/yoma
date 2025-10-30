using MediatR;
using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Referral.Events
{
  public sealed class ReferralProgressTriggerEventHandler : INotificationHandler<ReferralProgressTriggerEvent>
  {
    #region Class Variables
    private readonly ILogger<ReferralProgressTriggerEventHandler> _logger;
    #endregion

    #region Constructor
    public ReferralProgressTriggerEventHandler(ILogger<ReferralProgressTriggerEventHandler> logger)
    {
      _logger = logger;
    }
    #endregion

    #region Public Members
    public async Task Handle(ReferralProgressTriggerEvent notification, CancellationToken cancellationToken)
    {
      await Task.CompletedTask;

      // 1. Distributed lock per UserId (or per LinkUsageId, depending on what you key on)
      // 2. Load fresh state from DB:
      //    - user POP / identity status
      //    - link usage(s) for that user
      //    - myOpportunity completion state if MyOpportunityId present
      // 3. Run state transition logic for each affected referral usage
      // 4. Persist final outcomes (mark step/task complete, award, etc.)
    }
    #endregion
  }
}
