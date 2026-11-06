using FluentValidation;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class OrganizationRequestUpdateRewardPoolValidator : AbstractValidator<OrganizationRequestUpdateRewardPool>
  {
    #region Constructor
    public OrganizationRequestUpdateRewardPoolValidator()
    {
      RuleFor(x => x.ZltoRewardPoolCurrentFinancialYear)
        .GreaterThan(0).When(x => x.ZltoRewardPoolCurrentFinancialYear.HasValue).WithMessage("'{PropertyName}' must be greater than 0.")
        .LessThanOrEqualTo(10_000_000M).When(x => x.ZltoRewardPoolCurrentFinancialYear.HasValue).WithMessage("'{PropertyName}' must not exceed 10 million.")
        .Must(pool => !pool.HasValue || pool.Value % 1 == 0).WithMessage("'{PropertyName}' does not support decimal points.");
    }
    #endregion
  }
}
