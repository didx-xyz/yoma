using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Infrastructure.DidxMe;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Test.SSI.DidxMe
{
  public class WebhookTests
  {
    #region Tests
    [Theory]
    [InlineData("")]
    [InlineData("Unknown")]
    public async Task InvalidStoredStatusFailsBeforeMutation(string status)
    {
      var fixture = new Fixture();
      fixture.Mapping.Status = status;
      var invoked = false;

      await Assert.ThrowsAsync<ArgumentException>(() => fixture.Service.Update(fixture.Mapping.Id, _ => invoked = true));

      Assert.False(invoked);
      fixture.Repository.Verify(value => value.Update(It.IsAny<IssuanceMapping>()), Times.Never);
    }

    [Theory]
    [InlineData("valid")]
    [InlineData("rotation")]
    [InlineData("tampered")]
    [InlineData("expired")]
    [InlineData("missing")]
    [InlineData("unknown")]
    [InlineData("uncorrelated")]
    public void SignatureAndCorrelationAreVerifiedBeforeConsumption(string scenario)
    {
      var key = RandomNumberGenerator.GetBytes(32);
      var options = Options.Create(new ProviderOptions
      {
        Webhook = new WebhookOptions { SigningSecret = "whsec_" + Convert.ToBase64String(key) }
      });
      var parser = new WebhookParser(options);
      var walletId = Guid.NewGuid().ToString();
      var body = JsonConvert.SerializeObject(new
      {
        eventType = scenario == "unknown" ? "issuance.offered" : "wallet.credential.accepted",
        payload = new { openId4VcIssuanceId = scenario == "uncorrelated" ? null : "issuance-test" },
        tracing = new { paradymWebhookId = $"wallet:credential:{walletId}:accepted" }
      });
      var timestamp = DateTimeOffset.UtcNow.AddSeconds(scenario == "expired" ? -301 : 0).ToUnixTimeSeconds().ToString();
      var signature = "v1," + Convert.ToBase64String(HMACSHA256.HashData(key, Encoding.UTF8.GetBytes($"message.{timestamp}.{body}")));
      if (scenario == "rotation") signature = "v1,invalid v2,ignored " + signature;
      if (scenario == "missing") signature = null;
      if (scenario == "tampered") body += " ";

      if (scenario is "tampered" or "expired" or "missing")
        Assert.Throws<UnauthorizedAccessException>(() => parser.Parse(body, "message", timestamp, signature));
      else if (scenario == "uncorrelated")
        Assert.Throws<ArgumentException>(() => parser.Parse(body, "message", timestamp, signature));
      else if (scenario == "unknown") Assert.Null(parser.Parse(body, "message", timestamp, signature));
      else
      {
        var result = parser.Parse(body, "message", timestamp, signature);
        Assert.Equal("issuance-test", result!.IssuanceId);
        Assert.Equal(walletId, result.WalletCredentialId);
      }
    }

    [Fact]
    public async Task AcceptanceBeforeDeliveryReturnsSurvivesDuplicateAndLateEvents()
    {
      var fixture = new Fixture();
      await fixture.Service.Accept("session-test", "wallet-test");
      await fixture.Service.Update(fixture.Mapping.Id, item => item.DeliveryCompleted = true);
      await fixture.Service.Accept("session-test", "wallet-test");

      Assert.Equal("wallet-test", await fixture.Service.WaitForWalletId(fixture.Mapping.Id, TestContext.Current.CancellationToken));
      Assert.True(fixture.Mapping.DeliveryCompleted);
      await fixture.Service.Accept("session-test", "conflicting-wallet");
      Assert.Equal("wallet-test", fixture.Mapping.WalletCredentialId);
      Assert.Equal(nameof(IssuanceStatus.Accepted), fixture.Mapping.Status);
      var log = Assert.Single(fixture.Logger.Invocations, item => item.Method.Name == "Log");
      Assert.Equal(LogLevel.Error, log.Arguments[0]);
      Assert.Contains(fixture.Mapping.Id.ToString(), log.Arguments[2]!.ToString());
      await fixture.Service.ConfirmDeleted("holder-test", "wallet-test");
      await fixture.Service.Accept("session-test", "wallet-test");
      Assert.Equal(nameof(IssuanceStatus.Deleted), fixture.Mapping.Status);
      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.WaitForWalletId(fixture.Mapping.Id, TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task UnknownSessionsAreIgnoredAndPersistenceFailureIsNotAcknowledged()
    {
      var fixture = new Fixture();
      await fixture.Service.Accept("unknown", "wallet-test");
      fixture.Repository.Verify(value => value.Update(It.IsAny<IssuanceMapping>()), Times.Never);
      fixture.Repository.Setup(value => value.Update(It.IsAny<IssuanceMapping>())).ThrowsAsync(new InvalidOperationException("Database unavailable"));
      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Service.Accept("session-test", "wallet-test"));
    }

    [Fact]
    public async Task InlineWaitObservesAcceptanceWrittenByAnotherRequest()
    {
      var fixture = new Fixture();
      var waiting = fixture.Service.WaitForWalletId(fixture.Mapping.Id, TestContext.Current.CancellationToken);
      Assert.False(waiting.IsCompleted);
      await fixture.Service.Accept("session-test", "wallet-test");
      Assert.Equal("wallet-test", await waiting);
    }
    #endregion

    #region Fixtures
    private sealed class Fixture
    {
      public IssuanceMapping Mapping { get; } = new()
      {
        Id = Guid.NewGuid(),
        TenantAlias = "yoma",
        TenantIdHolder = "holder-test",
        IssuanceId = "session-test",
        Status = nameof(IssuanceStatus.Delivering)
      };
      public Mock<IRepository<IssuanceMapping>> Repository { get; } = new();
      public Mock<ILogger<IssuanceTrackingService>> Logger { get; } = new();
      public IssuanceTrackingService Service { get; }

      public Fixture()
      {
        Logger.Setup(logger => logger.IsEnabled(LogLevel.Error)).Returns(true);
        Repository.Setup(value => value.Query()).Returns(() => new[] { Mapping }.AsQueryable());
        Repository.Setup(value => value.Query(It.IsAny<LockMode>())).Returns(() => new[] { Mapping }.AsQueryable());
        Repository.Setup(value => value.Update(It.IsAny<IssuanceMapping>())).ReturnsAsync((IssuanceMapping item) => item);
        var strategy = new Mock<IProviderExecutionStrategyService>();
        strategy.Setup(value => value.ExecuteInExecutionStrategyAsync(It.IsAny<Func<Task>>(), true))
          .Returns((Func<Task> action, bool _) => action());
        Service = new IssuanceTrackingService(Logger.Object, Options.Create(new ProviderOptions
        {
          TenantAlias = "yoma",
          Webhook = new WebhookOptions { PollIntervalMilliseconds = 1 }
        }), Repository.Object, strategy.Object);
      }
    }
    #endregion
  }
}
