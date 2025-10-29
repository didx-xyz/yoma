using Yoma.Core.Domain.Core.Events;

namespace Yoma.Core.Domain.MyOpportunity.Events
{
  public class MyOpportunityEvent : BaseEvent<Models.MyOpportunity>
  {
    #region Constructor
    public MyOpportunityEvent(Models.MyOpportunity entity) : base(entity) { }
    #endregion
  }
}
