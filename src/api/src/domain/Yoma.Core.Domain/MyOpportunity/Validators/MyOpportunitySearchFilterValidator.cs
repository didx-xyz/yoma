using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
    public class MyOpportunitySearchFilterValidator : PaginationFilterValidator<MyOpportunitySearchFilter>
    {
        #region Constructor
        public MyOpportunitySearchFilterValidator()
        {
            RuleFor(filter => filter.VerificationStatus).Must((filter, verificationStatus) => filter.Action != Action.Verification || verificationStatus.HasValue)
                .When(filter => filter.Action == Action.Verification).WithMessage($"{{PropertyName}} must be specified when the '{nameof(Action)}' is '{nameof(Action.Verification)}'.");
            //pagination not required
        }
        #endregion
    }
}
