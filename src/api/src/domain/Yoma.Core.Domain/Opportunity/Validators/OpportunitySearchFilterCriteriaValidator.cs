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

            RuleFor(x => x.Organization)
                .Must(organizationId => !organizationId.HasValue || (organizationId != Guid.Empty && OrganizationExists(organizationId.Value)))
                .WithMessage("If specified, the organization must not be empty and must exist.");
            RuleFor(x => x.TitleContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.TitleContains)).WithMessage("{PropertyName} is optional, but when specified,m must be between 3 and 50 characters");
            RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
        }
        #endregion

        #region Private Members
        private bool OrganizationExists(Guid id)
        {
            return _organizationService.GetByIdOrNull(id, false, false, false) != null;
        }
        #endregion
    }
}
