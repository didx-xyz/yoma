using Yoma.Core.Domain.Core.Events;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Events
{
  public class OrganizationStatusChangedEvent : BaseEvent<Organization>
  {
    #region Constructor
    public OrganizationStatusChangedEvent(Organization organization) : base(organization) { }
    #endregion
  }
}
