using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Events;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Referral.Events
{
  public class IdentityActionEvent : BaseEvent<User>
  {
    #region Constructor
    public IdentityActionEvent(EventType eventType, User entity) : base(eventType, entity) { }
    #endregion
  }
}
