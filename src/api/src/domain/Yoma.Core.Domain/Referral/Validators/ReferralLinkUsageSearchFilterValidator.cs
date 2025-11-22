using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Validators
{
  public class ReferralLinkUsageSearchFilterValidator : PaginationFilterValidator<ReferralLinkUsageSearchFilterAdmin>
  {
    #region Constructor
    public ReferralLinkUsageSearchFilterValidator()
    {
      RuleFor(x => x.LinkId).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("Link Id is optional, but if specified, it cannot be empty.");
      RuleFor(x => x.ProgramId).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("Program Id is optional, but if specified, it cannot be empty.");

      RuleFor(x => x.DateStart).GreaterThanOrEqualTo(x => x.DateEnd).When(x => x.DateEnd.HasValue && x.DateStart.HasValue).WithMessage("End Date is earlier than the Start Date.");
      RuleFor(x => x.PaginationEnabled).Equal(true).When(x => !x.TotalCountOnly).WithMessage("Pagination required");

      RuleFor(x => x.UserIdReferee).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("User Id Referee is optional, but if specified, it cannot be empty.");
      RuleFor(x => x.UserIdReferrer).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("User Id Referrer is optional, but if specified, it cannot be empty.");
      RuleFor(x => x).Must(x => !(x.UserIdReferrer.HasValue && x.UserIdReferee.HasValue)).WithMessage("Only one of UserIdReferrer or UserIdReferee may be specified, not both.");
    }
    #endregion
  }
}
