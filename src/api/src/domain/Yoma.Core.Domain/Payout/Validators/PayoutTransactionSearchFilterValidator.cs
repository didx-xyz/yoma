using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Payout.Validators
{
  public sealed class PayoutTransactionSearchFilterValidator : PaginationFilterValidator<PayoutTransactionSearchFilter>
  {
    #region Constructor
    public PayoutTransactionSearchFilterValidator()
    {
      RuleFor(x => x.Id).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("Id is optional, but if specified, it cannot be empty.");
      RuleFor(x => x.UserId).Must(x => !x.HasValue || x != Guid.Empty).WithMessage("User Id is optional, but if specified, it cannot be empty.");
      RuleFor(x => x.AmountFrom).GreaterThan(0).When(x => x.AmountFrom.HasValue);
      RuleFor(x => x.AmountTo).GreaterThan(0).When(x => x.AmountTo.HasValue);
      RuleFor(x => x.AmountTo).GreaterThanOrEqualTo(x => x.AmountFrom).When(x => x.AmountFrom.HasValue && x.AmountTo.HasValue).WithMessage("Maximum Amount is less than the Minimum Amount.");
      RuleFor(x => x.DateEnd).GreaterThanOrEqualTo(x => x.DateStart).When(x => x.DateStart.HasValue && x.DateEnd.HasValue).WithMessage("End Date is earlier than the Start Date.");
      RuleFor(x => x.PaginationEnabled).Equal(true).WithMessage("Pagination required");
    }
    #endregion
  }
}
