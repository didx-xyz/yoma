using Flurl.Http.Testing;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using System.Net;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Payout;
using Yoma.Core.Domain.Payout.Models.Provider;
using Yoma.Core.Infrastructure.IXO.YellowCard.Client;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Test.Core
{
  public class YellowCardCancellationTests
  {
    [Theory]
    [InlineData("initiated", true)]
    [InlineData("processing", false)]
    [InlineData("completed", false)]
    [InlineData("failed", false)]
    [InlineData("cancelled", false)]
    [InlineData("expired", false)]
    public async Task StatusReturnsEligibilityWithoutRequestingSession(string status, bool expected)
    {
      using var http = new HttpTest();
      var id = Guid.NewGuid();
      http.RespondWithJson(new { yomaTransactionId = id, providerTransactionId = "pay_test", status });
      var result = await CreateClient().GetStatus(new PayoutStatusRequest { Id = id, TransactionId = "pay_test" });
      Assert.Equal(expected, result.CanCancel);
      http.ShouldHaveCalled($"https://ixo.test/partner/payouts/{id}").WithVerb(HttpMethod.Get).Times(1);
      Assert.Single(http.CallLog);
    }

    [Theory]
    [InlineData(true, "initiated", true)]
    [InlineData(false, "initiated", true)]
    [InlineData(true, "processing", false)]
    [InlineData(false, "processing", false)]
    public async Task StartAndResumeUseTheSameSessionMapping(bool initiate, string status, bool canCancel)
    {
      using var http = new HttpTest();
      var expiry = DateTimeOffset.UtcNow.AddMinutes(20);
      http.RespondWithJson(new
      {
        providerTransactionId = " pay_test ",
        paymentUrl = " https://ixo.test/pay ",
        expiresAt = expiry.ToString("O"),
        status
      }, initiate ? 201 : 200);
      if (initiate)
      {
        var result = await CreateClient().Initiate(CreateRequest());
        Assert.Equal("pay_test", result.TransactionId);
        Assert.Equal(canCancel, result.CanCancel);
        Assert.Equal("https://ixo.test/pay", result.PaymentUrl);
        Assert.Equal(expiry, result.ExpiresAt);
      }
      else
      {
        var result = await CreateClient().GetSession(new PayoutSessionRequest
        { Id = Guid.NewGuid(), TransactionId = "pay_test" });
        Assert.Equal(canCancel, result.CanCancel);
        Assert.Equal("https://ixo.test/pay", result.PaymentUrl);
        Assert.Equal(expiry, result.ExpiresAt);
      }
    }

    [Theory]
    [InlineData(true, "completed", "https://ixo.test/pay", "2030-01-01T00:00:00Z")]
    [InlineData(false, "completed", "https://ixo.test/pay", "2030-01-01T00:00:00Z")]
    [InlineData(true, "initiated", "http://ixo.test/pay", "2030-01-01T00:00:00Z")]
    [InlineData(false, "initiated", "http://ixo.test/pay", "2030-01-01T00:00:00Z")]
    [InlineData(true, "initiated", "https://ixo.test/pay", "invalid")]
    [InlineData(false, "initiated", "https://ixo.test/pay", "invalid")]
    public async Task StartAndResumeRejectInvalidSessionData(bool initiate, string status, string paymentUrl, string expiresAt)
    {
      using var http = new HttpTest();
      http.RespondWithJson(new { providerTransactionId = "pay_test", status, paymentUrl, expiresAt }, initiate ? 201 : 200);
      if (initiate)
        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateClient().Initiate(CreateRequest()));
      else
        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateClient().GetSession(
          new PayoutSessionRequest { Id = Guid.NewGuid(), TransactionId = "pay_test" }));
    }

    private static PayoutRequest CreateRequest() => new()
    {
      TransactionId = Guid.NewGuid(),
      UserId = Guid.NewGuid(),
      Username = "test",
      Email = "test@example.org",
      FirstName = "Test",
      Surname = "User",
      CountryCodeAlpha2 = "ZA",
      Gender = "Male",
      DateOfBirth = DateTimeOffset.UtcNow.AddYears(-25),
      AmountInUSD = 10
    };

    [Fact]
    public async Task CancelUsesPartnerAuthAndExactReferenceAndAllowsReplay()
    {
      using var http = new HttpTest();
      var id = Guid.NewGuid();
      http.RespondWithJson(new { yomaTransactionId = id, providerTransactionId = "pay_test", status = "cancelled" });
      var client = CreateClient();
      for (var i = 0; i < 2; i++)
      {
        var response = await client.Cancel(new PayoutCancellationRequest { Id = id, TransactionId = "pay_test" });
        Assert.Equal(id, response.Id);
        Assert.Equal(PayoutTransactionStatus.Cancelled, response.Status);
      }
      http.ShouldHaveCalled($"https://ixo.test/partner/payouts/{id}/cancel")
        .WithVerb(HttpMethod.Post).WithHeader("Authorization", "Bearer test-only").Times(2);
    }

    [Theory]
    [InlineData(409, "already_submitted", "processing")]
    [InlineData(409, "already_submitted", "completed")]
    [InlineData(409, "already_submitted", "failed")]
    [InlineData(409, "payout_expired", "expired")]
    [InlineData(404, null, null)]
    public async Task ProviderRefusalsAreNotCancellation(int status, string? code, string? payoutStatus)
    {
      using var http = new HttpTest();
      http.RespondWithJson(new { error = "refused", message = "Cannot cancel", status, code, payoutStatus }, status);
      var error = await Assert.ThrowsAsync<HttpClientException>(() => CreateClient().Cancel(
        new PayoutCancellationRequest { Id = Guid.NewGuid(), TransactionId = "pay_test" }));
      Assert.Equal((HttpStatusCode)status, error.StatusCode);
      if (code != null) Assert.Contains(code, error.Message);
    }

    [Theory]
    [InlineData("processing", false, false)]
    [InlineData("completed", false, false)]
    [InlineData("cancelled", true, false)]
    [InlineData("cancelled", false, true)]
    public async Task WrongStatusOrReferencesAreRejected(string status, bool wrongId, bool wrongProviderId)
    {
      using var http = new HttpTest();
      var id = Guid.NewGuid();
      http.RespondWithJson(new
      {
        yomaTransactionId = wrongId ? Guid.NewGuid() : id,
        providerTransactionId = wrongProviderId ? "different" : "pay_test",
        status
      });
      await Assert.ThrowsAsync<InvalidOperationException>(() => CreateClient().Cancel(
        new PayoutCancellationRequest { Id = id, TransactionId = "pay_test" }));
    }

    [Theory]
    [InlineData("initiated", true)]
    [InlineData("processing", false)]
    public async Task SessionCancellationEligibilityComesFromProviderStatus(string status, bool expected)
    {
      using var http = new HttpTest();
      http.RespondWithJson(new
      {
        providerTransactionId = "pay_test",
        paymentUrl = "https://ixo.test/pay",
        expiresAt = DateTimeOffset.UtcNow.AddMinutes(20).ToString("O"),
        status
      });
      var session = await CreateClient().GetSession(new PayoutSessionRequest { Id = Guid.NewGuid(), TransactionId = "pay_test" });
      Assert.Equal(expected, session.CanCancel);
    }

    [Fact]
    public async Task NetworkTimeoutIsNotCancellation()
    {
      using var http = new HttpTest();
      http.SimulateTimeout();
      await Assert.ThrowsAsync<HttpClientException>(() => CreateClient().Cancel(
        new PayoutCancellationRequest { Id = Guid.NewGuid(), TransactionId = "pay_test" }));
    }

    private static YellowCardClient CreateClient()
    {
      var auth = new Mock<IYellowCardAuthService>();
      auth.Setup(p => p.GetAuthHeader()).ReturnsAsync(new KeyValuePair<string, string>("Authorization", "Bearer test-only"));
      return new YellowCardClient(Mock.Of<ILogger<YellowCardClient>>(), new AppSettings(),
        new YellowCardOptions { BaseUrl = "https://ixo.test", PayoutsPath = "partner/payouts", RequestTimeoutSeconds = 5 },
        auth.Object, Mock.Of<IMemoryCache>(), Mock.Of<ICountryService>());
    }
  }
}
