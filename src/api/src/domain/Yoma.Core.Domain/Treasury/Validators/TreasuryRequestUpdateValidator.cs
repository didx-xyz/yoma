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
        .InclusiveBetween((byte)DateTime.MinValue.Month, (byte)DateTime.MaxValue.Month)
        .WithMessage("Financial year start month must be between 1 and 12.");

      RuleFor(x => x.FinancialYearStartDay)
        .Must((model, day) =>
          day >= DateTime.MinValue.Day &&
          day <= DateTime.DaysInMonth(2000, model.FinancialYearStartMonth))
        .WithMessage(model =>
          $"Financial year start day must be between 1 and {DateTime.DaysInMonth(2000, model.FinancialYearStartMonth)} for month {model.FinancialYearStartMonth}.");

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
