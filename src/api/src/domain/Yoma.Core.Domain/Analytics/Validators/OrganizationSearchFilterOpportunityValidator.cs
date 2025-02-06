using FluentValidation;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.Analytics.Validators
{
  public class OrganizationSearchFilterOpportunityValidator : OrganizationSearchFilterValidatorBase<OrganizationSearchFilterOpportunity>
  {
    #region Constructor
    public OrganizationSearchFilterOpportunityValidator(IOrganizationService organizationService) : base(organizationService)
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination is required.");
    }
    #endregion
  }
}
