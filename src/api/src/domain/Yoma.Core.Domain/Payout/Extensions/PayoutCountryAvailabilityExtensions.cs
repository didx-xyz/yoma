using FluentValidation;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Payout.Extensions
{
  public static class PayoutCountryAvailabilityExtensions
  {
    public static void ValidateMinimumAmount(this PayoutCountryAvailability country, decimal amount)
    {
      ArgumentNullException.ThrowIfNull(country);
      if (!country.MinimumAmount.HasValue) return;

      // Treasury and provider initiation are USD-only today. Separate profile currency fields
      // are metadata, not multi-currency support: never compare unlike monetary units or
      // silently disable malformed provider limits. Future currencies need explicit conversion rules.
      if (country.Currency != Currency.USD || country.MinimumAmount.Value < 0)
        throw new DataInconsistencyException("Invalid payout country minimum amount or currency");

      if (amount < country.MinimumAmount.Value)
        throw new ValidationException($"The minimum cash-out amount for your country is {country.MinimumAmount.Value:0.00} {country.Currency}");
    }
  }
}
