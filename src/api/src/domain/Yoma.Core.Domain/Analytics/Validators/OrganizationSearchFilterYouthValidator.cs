using FluentValidation;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.Analytics.Validators
{
  public class OrganizationSearchFilterYouthValidator : OrganizationSearchFilterValidatorBase<OrganizationSearchFilterYouth>
  {
    #region Constructor
    public OrganizationSearchFilterYouthValidator(IOrganizationService organizationService) : base(organizationService)
    {
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
    }
    #endregion
  }
}
