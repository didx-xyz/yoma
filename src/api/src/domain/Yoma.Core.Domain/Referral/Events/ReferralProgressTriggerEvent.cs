using Yoma.Core.Domain.Core.Events;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Events
{
  public sealed class ReferralProgressTriggerEvent : BaseEvent<ReferralProgressTriggerMessage>
  {
    #region Constructor
    public ReferralProgressTriggerEvent(ReferralProgressTriggerMessage entity) : base(entity) { }
    #endregion
  }
}
