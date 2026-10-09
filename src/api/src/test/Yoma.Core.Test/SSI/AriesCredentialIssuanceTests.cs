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
using Newtonsoft.Json;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Client;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Test.SSI
{
  public class AriesCredentialIssuanceTests
  {
    #region Tests
    [Fact]
    public async Task NewJwtUsesTheExactRequestedSchemaAndNotTheLatestNameVersion()
    {
      using var fixture = new Fixture();
      var result = await fixture.Client.IssueCredential(fixture.Request);

      var stored = Assert.Single(fixture.Credentials);
      Assert.Equal("schema-1.0", stored.SchemaId);
      Assert.Equal(stored.Id.ToString(), result.Id);
      Assert.Equal(stored.SchemaId, result.SchemaId);
      Assert.Equal("old value", result.Attributes["OldAttribute"]);
      Assert.Equal("old value", JsonConvert.DeserializeObject<Dictionary<string, string>>(stored.Attributes)!["OldAttribute"]);

      fixture.Request.SchemaId = "schema-2.0";
      fixture.Request.Attributes = new Dictionary<string, string> { ["NewAttribute"] = "new value" };
      var recovered = await fixture.Client.IssueCredential(fixture.Request);

      Assert.Equal(result.Id, recovered.Id);
      Assert.Equal("schema-1.0", recovered.SchemaId);
      Assert.Equal("old value", recovered.Attributes["OldAttribute"]);
      Assert.DoesNotContain("NewAttribute", recovered.Attributes.Keys);
      Assert.Single(fixture.Credentials);
      fixture.Repository.Verify(repository => repository.Create(It.IsAny<Infrastructure.AriesCloud.Models.Credential>()), Times.Once);
    }

    [Fact]
    public async Task ExistingJwtReturnsItsActualSchemaBeforeValidatingTheNewAttempt()
    {
      using var fixture = new Fixture();
      var original = fixture.AddCredential();
      fixture.Request.SchemaId = "schema-2.0";
      fixture.Request.Attributes["NotInEitherSchema"] = "new source value";

      var result = await fixture.Client.IssueCredential(fixture.Request);

      Assert.Single(fixture.Credentials);
      Assert.Equal(original.Id.ToString(), result.Id);
      Assert.Equal("schema-1.0", result.SchemaId);
      Assert.Equal("old value", result.Attributes["OldAttribute"]);
      Assert.DoesNotContain("NotInEitherSchema", result.Attributes.Keys);
      fixture.Repository.Verify(repository => repository.Create(It.IsAny<Infrastructure.AriesCloud.Models.Credential>()), Times.Never);
    }

    [Fact]
    public async Task ExistingAnonCredsReturnsTheActualHistoricalSchemaAndAttributes()
    {
      using var fixture = new Fixture();
      fixture.Request.ArtifactType = ArtifactType.ACR;
      fixture.Request.SchemaId = "schema-2.0";
      fixture.Request.SchemaName = "YoID|Default";
      fixture.Http.ForCallsTo("*credentials*").RespondWithJson(new
      {
        results = new[]
        {
          new
          {
            credential_id = "historical-credential",
            schema_id = "historical-yoid-schema",
            attrs = new Dictionary<string, string> { ["_Referent_Client"] = fixture.Request.ClientReferent.Value }
          }
        }
      });

      var result = await fixture.Client.IssueCredential(fixture.Request);

      Assert.Equal("historical-credential", result.Id);
      Assert.Equal("historical-yoid-schema", result.SchemaId);
      Assert.Equal(fixture.Request.ClientReferent.Value, result.Attributes["_Referent_Client"]);
      Assert.Empty(fixture.Credentials);
    }

    [Theory]
    [InlineData("missing-id")]
    [InlineData("wrong-name")]
    [InlineData("wrong-artifact")]
    [InlineData("undefined-attribute")]
    public async Task InvalidPinnedSchemaCannotCreateANewCredential(string mismatch)
    {
      using var fixture = new Fixture();
      switch (mismatch)
      {
        case "missing-id": fixture.Request.SchemaId = " "; break;
        case "wrong-name": fixture.Request.SchemaName = "Opportunity|Custom"; break;
        case "wrong-artifact": fixture.SchemaRows[0].ArtifactType = ArtifactType.ACR; break;
        case "undefined-attribute": fixture.Request.Attributes["Undefined"] = "invalid"; break;
        default: throw new NotSupportedException($"Mismatch '{mismatch}' is not supported");
      }

      await Assert.ThrowsAsync<ArgumentException>(() => fixture.Client.IssueCredential(fixture.Request));
      Assert.Empty(fixture.Credentials);
    }
    #endregion Tests

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      #region Class Variables
      private readonly ServiceProvider _services;

      public HttpTest Http { get; } = new();
      public List<Infrastructure.AriesCloud.Models.Credential> Credentials { get; } = [];
      public List<Infrastructure.AriesCloud.Models.CredentialSchema> SchemaRows { get; } = [];
      public Mock<IRepository<Infrastructure.AriesCloud.Models.Credential>> Repository { get; } = new();
      public CredentialIssuanceRequest Request { get; }
      public AriesCloudClient Client { get; }
      #endregion Class Variables

      #region Constructor
      public Fixture()
      {
        // All SDK HTTP traffic is intercepted; no real tenant, token, schema or credential is used.
        Http.RespondWithJson(new
        {
          access_token = "test-token",
          token = "test-token",
          expires_in = 3600,
          token_type = "Bearer",
          wallet_id = "tenant",
          wallet_name = "tenant",
          wallet_label = "tenant",
          created_at = DateTimeOffset.UtcNow.ToString("O"),
          connection_id = "connection",
          state = "completed",
          did = "did:test:issuer",
          key_type = "ed25519",
          method = "sov",
          posture = "public",
          verkey = "test-verkey",
          jws = "test-signed-value"
        });
        var configuration = new ConfigurationBuilder()
          .AddInMemoryCollection(new Dictionary<string, string?>
          {
            ["AriesCloudAPI:BaseUri"] = "https://ssi-test.invalid",
            ["AriesCloudAPI:TenantAdmin:ClientId"] = "test-client",
            ["AriesCloudAPI:TenantAdmin:ClientSecret"] = "test-value",
            ["AriesCloudAPI:GovernanceAdmin:ClientId"] = "test-client",
            ["AriesCloudAPI:GovernanceAdmin:ClientSecret"] = "test-value",
            ["AriesCloudAPI:TenantTokenCacheType"] = "MemoryCache",
            ["AriesCloudAPI:TenantTokenCacheRotationIntervalDays"] = "7",
            ["AriesCloudAPI:TenantTokenCacheEncryptionType"] = "DataProtection"
          })
          .Build();
        var services = new ServiceCollection().AddLogging().AddMemoryCache();
        services.AddAriesCloudAPI(configuration);
        services.AddSingleton<IDataProtectionProvider>(new EphemeralDataProtectionProvider());
        _services = services.BuildServiceProvider();
        var factory = new ClientFactory(_services.GetRequiredService<IServiceScopeFactory>(),
          _services.GetRequiredService<IOptions<AriesCloudAPIOptions>>());

        Request = new CredentialIssuanceRequest
        {
          ClientReferent = new KeyValuePair<string, string>("_Referent_Client", Guid.NewGuid().ToString()),
          SchemaId = "schema-1.0",
          SchemaName = "Opportunity|Job|Default",
          SchemaType = Domain.SSI.SchemaType.Opportunity.ToString(),
          ArtifactType = ArtifactType.JWS,
          TenantIdIssuer = "tenant",
          TenantIdHolder = "tenant",
          Attributes = new Dictionary<string, string> { ["OldAttribute"] = "old value" }
        };
        SchemaRows.AddRange([
          new Infrastructure.AriesCloud.Models.CredentialSchema
          {
            Id = "schema-1.0",
            Name = Request.SchemaName,
            Version = "1.0",
            AttributeNames = "[\"OldAttribute\"]",
            ArtifactType = ArtifactType.JWS
          },
          new Infrastructure.AriesCloud.Models.CredentialSchema
          {
            Id = "schema-2.0",
            Name = Request.SchemaName,
            Version = "2.0",
            AttributeNames = "[\"NewAttribute\"]",
            ArtifactType = ArtifactType.JWS
          }
        ]);
        var schemas = new Mock<IRepository<Infrastructure.AriesCloud.Models.CredentialSchema>>();
        schemas.Setup(repository => repository.Query()).Returns(() => SchemaRows.AsQueryable());
        Repository.Setup(repository => repository.Query()).Returns(() => Credentials.AsQueryable());
        Repository.Setup(repository => repository.Create(It.IsAny<Infrastructure.AriesCloud.Models.Credential>()))
          .ReturnsAsync((Infrastructure.AriesCloud.Models.Credential credential) =>
          {
            credential.Id = Guid.NewGuid();
            Credentials.Add(credential);
            return credential;
          });
        var connections = new Mock<IRepository<Infrastructure.AriesCloud.Models.Connection>>();
        connections.Setup(repository => repository.Query()).Returns(new[]
        {
          new Infrastructure.AriesCloud.Models.Connection
          {
            SourceTenantId = "tenant",
            TargetTenantId = "tenant",
            SourceConnectionId = "connection",
            TargetConnectionId = "connection",
            Protocol = Connection_protocol.Didexchange_1_1.ToString()
          }
        }.AsQueryable());
        Client = new AriesCloudClient(
          Mock.Of<ILogger<AriesCloudClient>>(),
          factory,
          Mock.Of<IEnvironmentProvider>(),
          Mock.Of<ISSEListenerService>(),
          Repository.Object,
          schemas.Object,
          connections.Object);
      }
      #endregion Constructor

      #region Public Members
      public Infrastructure.AriesCloud.Models.Credential AddCredential()
      {
        var credential = new Infrastructure.AriesCloud.Models.Credential
        {
          Id = Guid.NewGuid(),
          ClientReferent = Request.ClientReferent.Value,
          SourceTenantId = "tenant",
          TargetTenantId = "tenant",
          SchemaId = "schema-1.0",
          ArtifactType = ArtifactType.JWS.ToString(),
          Attributes = JsonConvert.SerializeObject(Request.Attributes),
          SignedValue = "historical-signed-value"
        };
        Credentials.Add(credential);
        return credential;
      }

      public void Dispose()
      {
        _services.Dispose();
        Http.Dispose();
      }
      #endregion Public Members
    }
    #endregion Fixture
  }
}
