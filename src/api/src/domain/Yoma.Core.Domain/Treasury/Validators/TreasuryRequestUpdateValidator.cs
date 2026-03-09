using FluentValidation;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Domain.Treasury.Validators
{
  public sealed class TreasuryRequestUpdateValidator : AbstractValidator<TreasuryRequestUpdate>
  {
    #region Constructor
    public TreasuryRequestUpdateValidator()
    {
      RuleFor(x => x.FinancialYearStartMonth)
        .InclusiveBetween((byte)1, (byte)12)
        .WithMessage("Financial year start month must be between 1 and 12.");

      RuleFor(x => x.FinancialYearStartDay)
        .InclusiveBetween((byte)1, (byte)31)
        .WithMessage("Financial year start day must be between 1 and 31.");

      RuleFor(x => x)
        .Must(x =>
        {
          try
          {
            _ = new DateTime(2000, x.FinancialYearStartMonth, x.FinancialYearStartDay);
            return true;
          }
          catch
          {
            return false;
          }
        })
        .WithMessage("Financial year start month and day do not form a valid date.");

      RuleFor(x => x.ZltoRewardPoolCurrentFinancialYear)
        .GreaterThan(0m)
        .When(x => x.ZltoRewardPoolCurrentFinancialYear.HasValue)
        .WithMessage("ZLTO reward pool for the current financial year must be greater than 0.")
        .LessThanOrEqualTo(100_000_000m)
        .When(x => x.ZltoRewardPoolCurrentFinancialYear.HasValue)
        .WithMessage("ZLTO reward pool for the current financial year may not exceed 100 million.")
        .Must(pool => !pool.HasValue || pool.Value % 1m == 0m)
        .When(x => x.ZltoRewardPoolCurrentFinancialYear.HasValue)
        .WithMessage("ZLTO reward pool for the current financial year must be a whole number.");

      RuleFor(x => x.ChimoneyPoolCurrentFinancialYearInUSD)
        .GreaterThan(0m)
        .When(x => x.ChimoneyPoolCurrentFinancialYearInUSD.HasValue)
        .WithMessage("Chimoney pool for the current financial year (USD) must be greater than 0.")
        .LessThanOrEqualTo(50_000m)
        .When(x => x.ChimoneyPoolCurrentFinancialYearInUSD.HasValue)
        .WithMessage("Chimoney pool for the current financial year (USD) may not exceed 50,000.")
        .Must(pool => !pool.HasValue || decimal.Round(pool.Value, 2) == pool.Value)
        .When(x => x.ChimoneyPoolCurrentFinancialYearInUSD.HasValue)
        .WithMessage("Chimoney pool for the current financial year (USD) may not have more than 2 decimal places.");

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
