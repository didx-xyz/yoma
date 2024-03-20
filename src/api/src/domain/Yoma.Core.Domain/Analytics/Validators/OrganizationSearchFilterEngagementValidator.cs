using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.Analytics.Validators
{
  public class OrganizationSearchFilterEngagementValidator : OrganizationSearchFilterValidatorBase<OrganizationSearchFilterEngagement>
  {
    #region Constructor
    public OrganizationSearchFilterEngagementValidator(IOrganizationService organizationService) : base(organizationService)
    {
    }
    #endregion
  }
}
