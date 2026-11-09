using FluentValidation;

namespace Yoma.Core.Domain.Entity.Extensions
{
  public static class ValidationExtensions
  {
    public static IRuleBuilderOptions<T, decimal?> ZltoRewardPool<T>(this IRuleBuilder<T, decimal?> rule)
    {
      // Nullable comparison validators allow an unset pool; a supplied pool must be a positive whole amount.
      return rule
        .GreaterThan(0).WithMessage("'{PropertyName}' must be greater than 0.")
        .LessThanOrEqualTo(10_000_000M).WithMessage("'{PropertyName}' must not exceed 10 million.")
        .Must(pool => !pool.HasValue || pool.Value % 1 == 0).WithMessage("'{PropertyName}' does not support decimal points.");
    }
  }
}
