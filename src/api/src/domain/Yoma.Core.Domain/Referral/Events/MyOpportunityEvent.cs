using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Events;

namespace Yoma.Core.Domain.Referral.Events
{
  public class MyOpportunityEvent : BaseEvent<MyOpportunity.Models.MyOpportunity>
  {
    #region Constructor
    public MyOpportunityEvent(EventType eventType, MyOpportunity.Models.MyOpportunity entity) : base(eventType, entity) { }
    #endregion
  }
}
