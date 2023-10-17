using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Validators
{
    public class MyOpportunitySearchFilterValidator : PaginationFilterValidator<MyOpportunitySearchFilterAdmin>
    {
        #region Class Variables
        #endregion

        #region Constructor
        public MyOpportunitySearchFilterValidator()
        {
            RuleFor(x => x.PaginationEnabled).Equal(true).When(x => !x.TotalCountOnly).WithMessage("Pagination required");
            RuleFor(x => x.UserId).Must(guid => guid == null || guid != Guid.Empty).WithMessage("{PropertyName} contains an empty value.");
            RuleFor(x => x.OpportunityId).Must(guid => guid == null || guid != Guid.Empty).WithMessage("{PropertyName} contains an empty value.");
            RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
            RuleFor(filter => filter.VerificationStatus).Must((filter, verificationStatus) => filter.Action != Action.Verification || verificationStatus.HasValue)
                .When(filter => filter.Action == Action.Verification).WithMessage($"{{PropertyName}} must be specified when the '{nameof(Action)}' is '{nameof(Action.Verification)}'.");
            //pagination not required
        }
        #endregion
    }
}
