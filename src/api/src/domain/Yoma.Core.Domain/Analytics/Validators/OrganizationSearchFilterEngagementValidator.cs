using FluentValidation;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.Analytics.Validators
{
  public class OrganizationSearchFilterEngagementValidator : OrganizationSearchFilterValidatorBase<OrganizationSearchFilterEngagement>
  {
    #region Constructor
    public OrganizationSearchFilterEngagementValidator(IOrganizationService organizationService) : base(organizationService)
    {
      RuleFor(x => x.Countries).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
    }
    #endregion
  }
}
