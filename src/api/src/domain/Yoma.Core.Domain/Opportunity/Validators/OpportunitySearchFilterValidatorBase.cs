using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Opportunity.Models;

namespace Yoma.Core.Domain.Opportunity.Validators
{
    public class OpportunitySearchFilterValidatorBase<TFilter> : PaginationFilterValidator<TFilter>
        where TFilter : OpportunitySearchFilterBase
    {
        #region Constructor
        public OpportunitySearchFilterValidatorBase()
        {
            RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
            RuleFor(x => x.TypeIds).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.CategoryIds).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.LanguageIds).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.CountryIds).Must(x => x == null || x.All(id => id != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
            RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
        }
        #endregion
    }
}
