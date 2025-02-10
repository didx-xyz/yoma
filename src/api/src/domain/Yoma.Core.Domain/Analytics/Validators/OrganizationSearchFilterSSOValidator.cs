using FluentValidation;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.Analytics.Validators
{
  public class OrganizationSearchFilterSSOValidator : AbstractValidator<OrganizationSearchFilterSSO>
  {
    #region Class Variables
    private readonly IOrganizationService _organizationService;
    #endregion

    #region Constructor
    public OrganizationSearchFilterSSOValidator(IOrganizationService organizationService)
    {
      _organizationService = organizationService;

      RuleFor(x => x.Organizations).Must(x => x == null || x.Count == 0 || OrganizationsExists(x)).WithMessage("{PropertyName} contains empty or invalid value(s).");
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => x.Organizations == null).WithMessage("Pagination is required when no organizations are specified.");
      RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate).When(x => x.EndDate.HasValue && x.StartDate.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
    }
    #endregion

    #region Private Members
    private bool OrganizationsExists(List<Guid>? organizations)
    {
      if (organizations == null || organizations.Count == 0) return false;
      if (organizations.Any(o => o == Guid.Empty)) return false;

      return _organizationService.EnsureExist(organizations, false);
    }
    #endregion
  }
}
