using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
    public class OpportunitySearchFilterValidator : PaginationFilterValidator<OpportunitySearchFilterAdmin>
    {
        #region Constructor
        public OpportunitySearchFilterValidator()
        {
            RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
            RuleFor(x => x.Types).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.Categories).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.Languages).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.Countries).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
            RuleFor(model => model.EndDate).GreaterThanOrEqualTo(model => model.StartDate).When(model => model.EndDate.HasValue && model.StartDate.HasValue).WithMessage("{PropertyName} is earlier than the Start Date.");
            RuleFor(x => x.Organizations).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
        }
        #endregion
    }
}
