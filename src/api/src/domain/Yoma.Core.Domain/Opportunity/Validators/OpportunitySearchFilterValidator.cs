using FluentValidation;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
    public class OpportunitySearchFilterValidator : OpportunitySearchFilterValidatorBase<OpportunitySearchFilter>
    {
        #region Constructor
        public OpportunitySearchFilterValidator()
        {
            RuleFor(model => model.EndDate).GreaterThanOrEqualTo(model => model.StartDate).When(model => model.EndDate.HasValue && model.StartDate.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
            RuleFor(x => x.Organizations).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
        }
        #endregion
    }
}
