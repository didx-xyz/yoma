using FluentValidation;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Domain.Treasury.Validators
{
  public sealed class TreasuryRequestUpdateValidator : AbstractValidator<TreasuryRequestUpdate>
  {
    #region Constructor
    public TreasuryRequestUpdateValidator()
    {
      RuleFor(x => x.ZltoRewardPool)
        .GreaterThan(0m)
        .When(x => x.ZltoRewardPool.HasValue)
        .WithMessage("ZLTO reward pool must be greater than 0.")
        .LessThanOrEqualTo(100_000_000m)
        .When(x => x.ZltoRewardPool.HasValue)
        .WithMessage("ZLTO reward pool may not exceed 100 million.")
        .Must(pool => !pool.HasValue || pool.Value % 1m == 0m)
        .When(x => x.ZltoRewardPool.HasValue)
        .WithMessage("ZLTO reward pool must be a whole number.");

      RuleFor(x => x.ChimoneyPoolInUSD)
        .GreaterThan(0m)
        .When(x => x.ChimoneyPoolInUSD.HasValue)
        .WithMessage("Chimoney pool (USD) must be greater than 0.")
        .LessThanOrEqualTo(50_000m)
        .When(x => x.ChimoneyPoolInUSD.HasValue)
        .WithMessage("Chimoney pool (USD) may not exceed 50,000.")
        .Must(pool => !pool.HasValue || decimal.Round(pool.Value, 2) == pool.Value)
        .When(x => x.ChimoneyPoolInUSD.HasValue)
        .WithMessage("Chimoney pool (USD) may not have more than 2 decimal places.");

      RuleFor(x => x.ConversionRateZltoUsd)
        .GreaterThan(0m)
        .WithMessage("Conversion rate must be greater than 0.")
        .LessThanOrEqualTo(1m)
        .WithMessage("Conversion rate may not exceed 1.0000 (1 ZLTO = 1 USD).")
        .Must(rate => decimal.Round(rate, 4) == rate)
        .WithMessage("Conversion rate may not have more than 4 decimal places.");
    }
    #endregion
  }
}
