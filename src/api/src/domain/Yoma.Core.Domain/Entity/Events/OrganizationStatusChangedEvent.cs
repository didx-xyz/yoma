using MediatR;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Events
{
  public class OrganizationStatusChangedEvent : INotification
  {
    #region Constructor
    public OrganizationStatusChangedEvent(Organization organization)
    {
      Organization = organization;
    }
    #endregion

    #region Public Members
    public Organization Organization { get; }
    #endregion
  }
}
