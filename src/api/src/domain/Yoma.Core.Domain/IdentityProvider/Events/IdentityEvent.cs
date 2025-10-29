using Yoma.Core.Domain.Core.Events;
using Yoma.Core.Domain.IdentityProvider.Models;

namespace Yoma.Core.Domain.IdentityProvider.Events
{
  public class IdentityEvent : BaseEvent<IdentityEventMessage>
  {
    #region Constructor
    public IdentityEvent(IdentityEventMessage entity) : base(entity) { }
    #endregion
  }
}
