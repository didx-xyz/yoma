using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public class ReferralAnalyticsSearchFilterValidator : PaginationFilterValidator<ReferralAnalyticsSearchFilterAdmin>
  {
    #region Constructor
    public ReferralAnalyticsSearchFilterValidator()
    {
      RuleFor(x => x.StartDate).GreaterThanOrEqualTo(x => x.EndDate).When(x => x.EndDate.HasValue && x.StartDate.HasValue).WithMessage("End Date is earlier than the Start Date.");
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => !x.UnrestrictedQuery).WithMessage("Pagination required.");
    }
    #endregion
  }
}
