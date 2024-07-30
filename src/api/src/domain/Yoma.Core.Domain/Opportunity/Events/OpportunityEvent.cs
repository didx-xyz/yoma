using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Events;

namespace Yoma.Core.Domain.Opportunity.Events
{
  public class OpportunityEvent : BaseEvent<Models.Opportunity>
  {
    #region Constructor
    public OpportunityEvent(EventType eventType, Models.Opportunity entity) : base(eventType, entity) { }
    #endregion
  }
}
