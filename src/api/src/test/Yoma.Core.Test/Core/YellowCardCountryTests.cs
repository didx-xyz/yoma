using Flurl.Http.Testing;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Payout;
using Yoma.Core.Infrastructure.IXO.YellowCard.Client;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Test.Core
{
  public class YellowCardCountryTests
  {
    [Theory]
    [InlineData("29376.34", "29376.34")]
    [InlineData("null", null)]
    public void DeserializesOptionalProviderMaximum(string value, string? expected)
    {
      var limits = Newtonsoft.Json.JsonConvert.DeserializeObject<YellowCardCountryLimits>("{\"highestMaxUsd\":" + value + "}");
      Assert.NotNull(limits);
      Assert.Equal(expected == null ? null : decimal.Parse(expected, System.Globalization.CultureInfo.InvariantCulture), limits.HighestMaxUsd);
    }

    [Theory]
    [InlineData("6.48", "6.48")]
    [InlineData("0", null)]
    [InlineData("null", null)]
    public async Task MapsUsdMinimumWithoutLocalCurrencyConversion(string value, string? expected)
    {
      using var http = new HttpTest();
      http.RespondWith("{\"success\":true,\"count\":1,\"countries\":[\"ZA\"],\"limits\":{\"za\":{\"currency\":\"ZAR\",\"rate\":16.21,\"lowestMinUsd\":" + value + "}}}");
      var result = await CreateClient().ListCountriesSupported();
      var country = Assert.Single(result.Countries!);
      Assert.Equal(expected == null ? null : decimal.Parse(expected, System.Globalization.CultureInfo.InvariantCulture), country.MinimumAmount);
      Assert.Equal(Currency.USD, country.Currency);
      Assert.Equal("ZAF", country.CodeAlpha3);
      Assert.Equal("710", country.CodeNumeric);
      http.ShouldHaveCalled("https://ixo.test/countries?ramp=offramp&limits=true").WithVerb(HttpMethod.Get).Times(1);
      Assert.False(http.CallLog.Single().Request.Headers.Contains("Authorization"));
    }

    [Theory]
    [InlineData("")]
    [InlineData(",\"limits\":null")]
    [InlineData(",\"limits\":{}")]
    [InlineData(",\"limits\":{\"ZA\":null}")]
    [InlineData(",\"limits\":{\"ZA\":{}}")]
    public async Task MissingLimitRetainsNullableContract(string limits)
    {
      using var http = new HttpTest();
      http.RespondWith("{\"success\":true,\"count\":1,\"countries\":[\"ZA\"]" + limits + "}");
      var result = await CreateClient().ListCountriesSupported();
      Assert.Null(Assert.Single(result.Countries!).MinimumAmount);
    }

    [Fact]
    public async Task NegativeMinimumIsRejected()
    {
      using var http = new HttpTest();
      http.RespondWithJson(new { success = true, count = 1, countries = new[] { "ZA" }, limits = new { ZA = new { lowestMinUsd = -1 } } });
      await Assert.ThrowsAsync<DataInconsistencyException>(() => CreateClient().ListCountriesSupported());
    }

    [Fact]
    public async Task CacheHasOneHourAbsoluteCap()
    {
      using var http = new HttpTest();
      http.RespondWithJson(new { success = true, count = 1, countries = new[] { "ZA" }, limits = new { ZA = new { lowestMinUsd = 6.48m } } });
      var entry = new Mock<ICacheEntry>();
      entry.SetupAllProperties();
      var cache = new Mock<IMemoryCache>();
      cache.Setup(p => p.CreateEntry(It.IsAny<object>())).Returns(entry.Object);
      await CreateClient(cache.Object).ListCountriesSupported();
      Assert.Equal(TimeSpan.FromHours(1), entry.Object.AbsoluteExpirationRelativeToNow);
      Assert.Null(entry.Object.SlidingExpiration);
    }

    private static YellowCardClient CreateClient(IMemoryCache? cache = null)
    {
      var countries = new Mock<ICountryService>();
      countries.Setup(p => p.List(true)).Returns([new Country
      {
        Id = Guid.NewGuid(), Name = "South Africa", CodeAlpha2 = "ZA", CodeAlpha3 = "ZAF", CodeNumeric = "710"
      }]);
      return new YellowCardClient(Mock.Of<ILogger<YellowCardClient>>(), new AppSettings
      {
        CacheEnabledByCacheItemTypes = cache == null ? "" : "Lookups",
        CacheSlidingExpirationInHours = 2,
        CacheAbsoluteExpirationRelativeToNowInDays = 7
      }, new YellowCardOptions
      {
        SupportedCountriesUrl = "https://ixo.test/countries?ramp=offramp",
        RequestTimeoutSeconds = 5
      }, Mock.Of<IYellowCardAuthService>(), cache ?? Mock.Of<IMemoryCache>(), countries.Object);
    }
  }
}
