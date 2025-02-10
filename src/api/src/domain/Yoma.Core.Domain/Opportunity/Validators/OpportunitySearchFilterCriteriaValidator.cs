using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunitySearchFilterCriteriaValidator : PaginationFilterValidator<OpportunitySearchFilterCriteria>
  {
    #region Class Variables
    private readonly IOrganizationService _organizationService;
    #endregion

    #region Constructor
    public OpportunitySearchFilterCriteriaValidator(IOrganizationService organizationService)
    {
      _organizationService = organizationService;

      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
      RuleFor(x => x.Organizations).Must(x => x == null || x.Count == 0 || OrganizationsExists(x)).WithMessage("{PropertyName} contains empty or invalid value(s).");
      RuleFor(x => x.TitleContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.TitleContains)).WithMessage("{PropertyName} is optional, but when specified,m must be between 3 and 50 characters");
      RuleFor(x => x.Opportunities).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.Countries).Must(x => x == null || x.Count == 0 || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
      RuleFor(x => x.VerificationEnabled).NotEqual(false).When(x => x.VerificationMethod != null).WithMessage("VerificationEnabled cannot be false when a VerificationMethod is specified.");
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
