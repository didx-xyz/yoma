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

      RuleFor(x => x.Organizations).Must(x => x == null || x.Count == 0 || x.All(OrganizationExists)).WithMessage("{PropertyName} contains empty or invalid value(s).");
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => x.Organizations == null).WithMessage("Pagination is required when no organizations are specified.");
      RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate).When(x => x.EndDate.HasValue && x.StartDate.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
    }
    #endregion

    #region Private Members
    private bool OrganizationExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _organizationService.GetByIdOrNull(id, false, false, false) != null;
    }
    #endregion
  }
}
