using Aries.CloudAPI.DotnetSDK.AspCore.Clients;
using Aries.CloudAPI.DotnetSDK.AspCore.Clients.Models;
using Aries.CloudAPI.DotnetSDK.AspCore.Configuration.DependencyInjection;
using Flurl.Http.Testing;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Net;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Client;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Test.SSI
{
  public class StageYoIDIssuanceTests
  {
    #region Tests
    [Fact]
    public async Task StageYoIDUsesSelectedOriginalSchemaInsteadOfLatestCfVersion()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      Assert.Equal("existing-credential", await fixture.Client.IssueCredential(fixture.Request));
      var call = Assert.Single(fixture.Http.CallLog, call => call.Request.Url.Path.Contains("definitions/schemas"));
      Assert.EndsWith("/definitions/schemas/schema-original", call.Request.Url.Path);
      Assert.DoesNotContain(fixture.Http.CallLog, call => call.Request.Verb == HttpMethod.Post &&
        call.Request.Url.Path.Contains("issue"));
    }

    [Theory]
    [InlineData(Domain.Core.Environment.Production)]
    [InlineData(Domain.Core.Environment.Development)]
    [InlineData(Domain.Core.Environment.Local)]
    [InlineData(Domain.Core.Environment.Staging | Domain.Core.Environment.Production)]
    public async Task OtherEnvironmentsStillResolveLatestEvenWhenSchemaIdIsProvided(Domain.Core.Environment environment)
    {
      using var fixture = new Fixture(environment);
      await Assert.ThrowsAsync<ArgumentException>(() => fixture.Client.IssueCredential(fixture.Request));
      var call = Assert.Single(fixture.Http.CallLog, call => call.Request.Url.Path.Contains("definitions/schemas"));
      Assert.Contains("schema_name=", call.Request.Url.ToString());
      Assert.DoesNotContain("schema-original", call.Request.Url.Path);
    }

    [Fact]
    public async Task StageOpportunityDoesNotUseYoIDOverride()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Request.SchemaType = Domain.SSI.SchemaType.Opportunity.ToString();
      await Assert.ThrowsAsync<ArgumentException>(() => fixture.Client.IssueCredential(fixture.Request));
      Assert.DoesNotContain(fixture.Http.CallLog, call => call.Request.Url.Path.EndsWith("schema-original"));
    }

    [Fact]
    public async Task StageWithoutSelectedIdRetainsExistingResolution()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Request.SchemaId = null;
      await Assert.ThrowsAsync<ArgumentException>(() => fixture.Client.IssueCredential(fixture.Request));
      Assert.DoesNotContain(fixture.Http.CallLog, call => call.Request.Url.Path.EndsWith("schema-original"));
    }

    [Fact]
    public async Task StageCannotIssueAgainstAnUnexpectedSchemaIdentity()
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging);
      fixture.Request.SchemaName = "YoID|Different";
      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Client.IssueCredential(fixture.Request));
      Assert.DoesNotContain(fixture.Http.CallLog, call => call.Request.Url.Path.Contains("wallets"));
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task StageDoesNotHideProviderFailures(HttpStatusCode status)
    {
      using var fixture = new Fixture(Domain.Core.Environment.Staging, status);
      var error = await Assert.ThrowsAsync<Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException>(
        () => fixture.Client.IssueCredential(fixture.Request));
      Assert.Equal(status, error.StatusCode);
    }
    #endregion Tests

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      private readonly ServiceProvider _services;
      public HttpTest Http { get; } = new();
      public CredentialIssuanceRequest Request { get; }
      public AriesCloudClient Client { get; }

      public Fixture(Domain.Core.Environment environment, HttpStatusCode schemaLookupStatus = HttpStatusCode.OK)
      {
        Http.RespondWithJson(new
        {
          access_token = "test-token",
          token = "test-token",
          expires_in = 3600,
          token_type = "Bearer",
          wallet_id = "tenant",
          wallet_name = "tenant",
          wallet_label = "tenant",
          created_at = DateTimeOffset.UtcNow.ToString("O")
        });
        Http.ForCallsTo("*definitions/schemas?*").RespondWithJson(new[]
        {
          new { id = "schema-cf", name = "YoID|Default", version = "1.1", attribute_names = new[] { "User_AccountVerificationMethods", "_Referent_Client" } }
        });
        Http.ForCallsTo("*definitions/schemas/schema-original").RespondWithJson(new
        {
          id = "schema-original",
          name = "YoID|Default",
          version = "1.0",
          attribute_names = new[] { "User_Email", "_Referent_Client" }
        }, (int)schemaLookupStatus);
        Http.ForCallsTo("*wallet/credentials*").RespondWithJson(new
        {
          results = new[] { new { credential_id = "existing-credential", schema_id = "schema-original", attrs = new { User_Email = "test@example.invalid" } } }
        });
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
          ["AriesCloudAPI:BaseUri"] = "https://ssi-test.invalid",
          ["AriesCloudAPI:TenantAdmin:ClientId"] = "test-client",
          ["AriesCloudAPI:TenantAdmin:ClientSecret"] = "test-value",
          ["AriesCloudAPI:GovernanceAdmin:ClientId"] = "test-client",
          ["AriesCloudAPI:GovernanceAdmin:ClientSecret"] = "test-value",
          ["AriesCloudAPI:TenantTokenCacheType"] = "MemoryCache",
          ["AriesCloudAPI:TenantTokenCacheRotationIntervalDays"] = "7",
          ["AriesCloudAPI:TenantTokenCacheEncryptionType"] = "DataProtection"
        }).Build();
        var services = new ServiceCollection().AddLogging().AddMemoryCache();
        services.AddAriesCloudAPI(configuration);
        services.AddSingleton<IDataProtectionProvider>(new EphemeralDataProtectionProvider());
        _services = services.BuildServiceProvider();
        var factory = new ClientFactory(_services.GetRequiredService<IServiceScopeFactory>(),
          _services.GetRequiredService<IOptions<AriesCloudAPIOptions>>());
        var environmentProvider = new Mock<IEnvironmentProvider>();
        environmentProvider.SetupGet(provider => provider.Environment).Returns(environment);
        var schemas = new Mock<IRepository<Infrastructure.AriesCloud.Models.CredentialSchema>>();
        schemas.Setup(repository => repository.Query()).Returns(Array.Empty<Infrastructure.AriesCloud.Models.CredentialSchema>().AsQueryable());
        Client = new AriesCloudClient(Mock.Of<ILogger<AriesCloudClient>>(), factory, environmentProvider.Object,
          Mock.Of<ISSEListenerService>(), Mock.Of<IRepository<Infrastructure.AriesCloud.Models.Credential>>(), schemas.Object,
          Mock.Of<IRepository<Infrastructure.AriesCloud.Models.Connection>>());
        Request = new CredentialIssuanceRequest
        {
          ClientReferent = new("_Referent_Client", "test-referent"),
          SchemaName = "YoID|Default",
          SchemaId = "schema-original",
          SchemaType = Domain.SSI.SchemaType.YoID.ToString(),
          ArtifactType = ArtifactType.ACR,
          TenantIdIssuer = "tenant",
          TenantIdHolder = "tenant",
          Attributes = new() { ["User_Email"] = "test@example.invalid", ["_Referent_Client"] = "test-referent" }
        };
      }

      public void Dispose()
      {
        _services.Dispose();
        Http.Dispose();
      }
    }
    #endregion Fixture
  }
}
