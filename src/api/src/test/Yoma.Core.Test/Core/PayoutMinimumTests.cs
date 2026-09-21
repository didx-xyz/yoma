using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Extensions;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces.Lookups;
using Yoma.Core.Domain.Payout.Interfaces.Provider;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Domain.Payout.Services;
using Yoma.Core.Domain.Reward;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Treasury.Interfaces;
using Provider = Yoma.Core.Domain.Payout.Provider;

namespace Yoma.Core.Test.Core
{
  public class PayoutMinimumTests
  {
    [Theory]
    [InlineData(null, "0.01", false)]
    [InlineData("0", "0.01", false)]
    [InlineData("7", "6.99", true)]
    [InlineData("7", "7", false)]
    [InlineData("7", "7.01", false)]
    public void MinimumBoundary(string? minimum, string amount, bool rejected)
    {
      var country = new PayoutCountryAvailability
      {
        MinimumAmount = minimum == null ? null : decimal.Parse(minimum, System.Globalization.CultureInfo.InvariantCulture),
        Currency = Currency.USD
      };
      var value = decimal.Parse(amount, System.Globalization.CultureInfo.InvariantCulture);
      if (rejected) Assert.Throws<ValidationException>(() => country.ValidateMinimumAmount(value));
      else country.ValidateMinimumAmount(value);
    }

    [Fact]
    public void MalformedLimitIsNotSilentlyIgnored()
    {
      Assert.Throws<DataInconsistencyException>(() => new PayoutCountryAvailability
      { MinimumAmount = -1, Currency = Currency.USD }.ValidateMinimumAmount(10));
      Assert.Throws<DataInconsistencyException>(() => new PayoutCountryAvailability
      { MinimumAmount = 1, Currency = null }.ValidateMinimumAmount(10));
    }

    [Theory]
    [InlineData(null)]
    [InlineData(7)]
    public void ProfileExposesMinimumWithoutAnActivePayout(int? minimum)
    {
      var profile = new UserProfilePayout
      {
        CountryAvailability = new PayoutCountryAvailability
        { Supported = true, MinimumAmount = minimum, Currency = Currency.USD }
      };
      Assert.Equal(minimum.HasValue ? (decimal?)minimum.Value : null, profile.CountryAvailability.MinimumAmount);
      Assert.Null(profile.Amount);
      Assert.Null(profile.Currency);
      Assert.Equal(Currency.USD, profile.CountryAvailability.Currency);
      Assert.False(profile.Active);
      Assert.False(profile.CanResume);
      var json = Newtonsoft.Json.Linq.JObject.Parse(Newtonsoft.Json.JsonConvert.SerializeObject(profile,
        new Newtonsoft.Json.JsonSerializerSettings
        {
          ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver(),
          Converters = [new Newtonsoft.Json.Converters.StringEnumConverter()]
        }));
      Assert.Null(json.Property("minimumAmount"));
      Assert.Null(json.Property("minimumAmountCurrency"));
      Assert.Null((string?)json["currency"]);
      var availability = (Newtonsoft.Json.Linq.JObject)json["countryAvailability"]!;
      Assert.NotNull(availability.Property("minimumAmount"));
      Assert.Equal(minimum.HasValue ? (decimal?)minimum.Value : null, (decimal?)availability["minimumAmount"]);
      Assert.Equal("USD", (string?)availability["currency"]);
    }

    [Fact]
    public void ProfileCountryChangeDoesNotRelabelOrBlockActivePayout()
    {
      var profile = new UserProfilePayout
      {
        Status = PayoutTransactionStatus.Processing,
        CanResume = true,
        Amount = 10m,
        Currency = Currency.USD,
        CountryAvailability = new PayoutCountryAvailability
        { Supported = true, MinimumAmount = 7m, Currency = Currency.USD }
      };
      // Separate sources even if future currencies are added; do not invent another enum value today.
      profile.CountryAvailability = new PayoutCountryAvailability();
      Assert.Null(profile.CountryAvailability.MinimumAmount);
      Assert.Null(profile.CountryAvailability.Currency);
      Assert.Equal(10m, profile.Amount);
      Assert.Equal(Currency.USD, profile.Currency);
      Assert.True(profile.Active);
      Assert.True(profile.CanResume);
      profile.CountryAvailability = new PayoutCountryAvailability
      { Supported = true, MinimumAmount = 12m, Currency = Currency.USD };
      Assert.Equal(12m, profile.CountryAvailability.MinimumAmount);
      Assert.Equal(10m, profile.Amount);
      Assert.True(profile.CanResume);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task BelowMinimumStopsBeforeCreationAndReservation(bool reward)
    {
      var fixture = new Fixture();
      if (reward) await Assert.ThrowsAsync<ValidationException>(() => fixture.Service.PayoutRewards(fixture.User.Id, 100));
      else await Assert.ThrowsAsync<ValidationException>(() => fixture.Service.Payout(fixture.User.Id, 6.99m));

      Assert.DoesNotContain(fixture.Transactions.Invocations, i => i.Method.Name == nameof(IPayoutTransactionService.Create));
      fixture.RewardProvider.VerifyNoOtherCalls();
      Assert.DoesNotContain(fixture.Provider.Invocations, i => i.Method.Name == nameof(IPayoutProviderClient.Initiate));
      fixture.Provider.Verify(p => p.ListCountriesSupported(), Times.Once);
    }

    [Fact]
    public async Task CountryMetadataUsesOneLookupAndUnsupportedCountryHasNoLimit()
    {
      var fixture = new Fixture();
      var supported = await fixture.Service.IsCountrySupported(fixture.User.CountryId);
      Assert.True(supported.Supported);
      Assert.Equal(7m, supported.MinimumAmount);
      Assert.Equal(Currency.USD, supported.Currency);
      fixture.Provider.Verify(p => p.ListCountriesSupported(), Times.Once);
      var unsupported = await fixture.Service.IsCountrySupported(Guid.NewGuid());
      Assert.False(unsupported.Supported);
      Assert.Null(unsupported.MinimumAmount);
      Assert.Null(unsupported.Currency);
    }

    [Theory]
    [InlineData(true, "7", "0.06995", "7")]
    [InlineData(true, "7", "0.0701", "7.01")]
    [InlineData(true, null, "0.001", "0.10")]
    [InlineData(false, "7", "0.01", "100")]
    public async Task AllowedAmountReachesCreationUsingRoundedCurrentRate(bool reward, string? minimum, string rate, string expected)
    {
      var culture = System.Globalization.CultureInfo.InvariantCulture;
      var fixture = new Fixture(minimum == null ? null : decimal.Parse(minimum, culture), decimal.Parse(rate, culture));
      // Stop at the persistence boundary: no database, reservation, lock or provider side effect.
      fixture.Transactions.Setup(p => p.Create(fixture.User.Id, It.IsAny<PayoutType>(), Provider.YellowCard,
          decimal.Parse(expected, culture), It.IsAny<DateTimeOffset?>()))
        .ThrowsAsync(new InvalidOperationException("Creation reached"));
      var error = reward
        ? await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.PayoutRewards(fixture.User.Id, 100))
        : await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.Payout(fixture.User.Id, 100));
      Assert.Equal("Creation reached", error.Message);
      fixture.Transactions.Verify(p => p.Create(fixture.User.Id, It.IsAny<PayoutType>(), Provider.YellowCard,
        decimal.Parse(expected, culture), It.IsAny<DateTimeOffset?>()), Times.Once);
      fixture.RewardProvider.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task OfflineAndMissingCountryDoNotAdvertiseMinimum()
    {
      var fixture = new Fixture();
      var missing = await fixture.Service.IsCountrySupported(null);
      Assert.False(missing.Supported);
      Assert.Null(missing.MinimumAmount);
      fixture.Provider.VerifyNoOtherCalls();
      fixture.Provider.Setup(p => p.ListCountriesSupported()).ReturnsAsync(new PayoutCountries { Offline = true });
      var offline = await fixture.Service.IsCountrySupported(fixture.User.CountryId);
      Assert.True(offline.Offline);
      Assert.False(offline.Supported);
      Assert.Null(offline.MinimumAmount);
      Assert.Null(offline.Currency);
    }

    private sealed class Fixture
    {
      public User User { get; } = new()
      {
        Id = Guid.NewGuid(),
        CountryId = Guid.NewGuid(),
        Email = "test@example.org",
        FirstName = "Test",
        Surname = "User",
        Gender = "Other",
        DateOfBirth = DateTimeOffset.UtcNow.AddYears(-25)
      };
      public Mock<IPayoutProviderClient> Provider { get; } = new();
      public Mock<IRewardProviderClient> RewardProvider { get; } = new(MockBehavior.Strict);
      public Mock<IPayoutTransactionService> Transactions { get; } = new();
      public PayoutService Service { get; }

      public Fixture(decimal? minimum = 7m, decimal rate = 0.06994m)
      {
        Provider.Setup(p => p.ListCountriesSupported()).ReturnsAsync(new PayoutCountries
        {
          Countries = [new PayoutCountry { Id = User.CountryId!.Value, MinimumAmount = minimum }]
        });
        var providerFactory = new Mock<IPayoutProviderClientFactory>();
        providerFactory.Setup(p => p.CreateClient()).Returns(Provider.Object);
        var rewardFactory = new Mock<IRewardProviderClientFactory>();
        rewardFactory.Setup(p => p.CreateClient()).Returns(RewardProvider.Object);
        var users = new Mock<IUserService>();
        users.Setup(p => p.GetById(User.Id, false, false)).Returns(User);
        var wallets = new Mock<IWalletService>();
        wallets.Setup(p => p.GetWalletStatusAndBalance(User.Id)).ReturnsAsync(
          (WalletCreationStatus.Created, new WalletBalance { WalletId = "test-wallet", Available = 1000 }));
        var treasury = new Mock<ITreasuryService>();
        treasury.Setup(p => p.Get(LockMode.Wait)).Returns(new Domain.Treasury.Models.Treasury { ConversionRateZltoUsd = rate });
        var strategy = new Mock<IExecutionStrategyService>();
        strategy.Setup(p => p.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), false))
          .Returns((Func<Task> body, bool _) => body());
        var environment = new Mock<IEnvironmentProvider>();
        environment.SetupGet(p => p.Environment).Returns(Domain.Core.Environment.Staging);
        Service = new PayoutService(Mock.Of<ILogger<PayoutService>>(), Options.Create(new AppSettings
        { PayoutEnabledEnvironments = "Staging", DistributedLockPayoutDurationInSeconds = 30, PayoutRewardReservationExpirationInMinutes = 1800 }),
          environment.Object, Mock.Of<IDistributedLockService>(), users.Object, Mock.Of<ICountryService>(),
          wallets.Object, Mock.Of<IRewardService>(), rewardFactory.Object, Transactions.Object,
          Mock.Of<IRepositoryValueContains<PayoutTransaction>>(), Mock.Of<IPayoutTransactionStatusService>(),
          providerFactory.Object, treasury.Object, strategy.Object, Mock.Of<INotificationDeliveryService>(), Mock.Of<INotificationURLFactory>());
      }
    }
  }
}
