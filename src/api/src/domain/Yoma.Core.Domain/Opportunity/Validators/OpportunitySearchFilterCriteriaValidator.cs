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

            RuleFor(x => x.Organization).NotEmpty().Must(Organizationxists).WithMessage($"Specified organization is invalid / does not exist.");
            RuleFor(x => x.TitleContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.TitleContains)).WithMessage("{PropertyName} is optional, but when specified,m must be between 3 and 50 characters");
            RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
        }
        #endregion

        #region Private Members
        private bool Organizationxists(Guid id)
        {
            return _organizationService.GetByIdOrNull(id, false, false, false) != null;
        }
        #endregion
    }
}
