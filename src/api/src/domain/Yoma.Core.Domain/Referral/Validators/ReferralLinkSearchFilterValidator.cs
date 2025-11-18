using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public class ReferralLinkSearchFilterValidator : PaginationFilterValidator<ReferralLinkSearchFilterAdmin>
  {
    #region Constructor
    public ReferralLinkSearchFilterValidator()
    {
      RuleFor(x => x.ProgramId).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("Program Id is optional, but if specified, it cannot be empty.");
      RuleFor(x => x.UserId).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("User Id is optional, but if specified, it cannot be empty.");
      RuleFor(x => x.ValueContains).Length(3, 50).When(x => !string.IsNullOrEmpty(x.ValueContains));
      RuleFor(x => x.DateStart).GreaterThanOrEqualTo(x => x.DateEnd).When(x => x.DateEnd.HasValue && x.DateStart.HasValue).WithMessage("End Date is earlier than the Start Date.");
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
    }
    #endregion
  }
}
