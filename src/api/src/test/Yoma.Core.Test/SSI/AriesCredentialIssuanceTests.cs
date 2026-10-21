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
using System.Net;
using Xunit;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Client;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Test.SSI
{
  public class AriesCredentialIssuanceTests
  {
    #region Class Variables
    private const string AnonCredsSchemaId = "did:cheqd:testnet:11111111-1111-1111-1111-111111111111/resources/22222222-2222-2222-2222-222222222222";
    private static readonly string[] AnonCredsAttributeNames = ["User_DisplayName", "_Referent_Client"];
    #endregion Class Variables

    #region Tests
    [Fact]
    public async Task InvalidProviderListIsNotTreatedAsConfirmedAbsence()
    {
      using var fixture = new Fixture();
      fixture.Http.ForCallsTo("*credentials*").WithVerb(HttpMethod.Get).RespondWithJson(new { });

      await Assert.ThrowsAsync<DataInconsistencyException>(() => fixture.Client.GetCredentialByClientReferentOrNull(
        "tenant", ArtifactType.ACR, fixture.Request.ClientReferent));
    }

    [Fact]
    public async Task MissingLocalReplayCredentialIsConfirmedWithoutAnyProviderRequest()
    {
      using var fixture = new Fixture();

      Assert.Null(await fixture.Client.GetCredentialByIdOrNull("tenant", ArtifactType.JWS, Guid.NewGuid().ToString()));
      Assert.Empty(fixture.Http.CallLog);
    }

    [Fact]
    public async Task ReplayDeletesOnlyTheExactLocalHolderCredentialAndCanBeRepeated()
    {
      using var fixture = new Fixture();
      var credential = fixture.AddCredential();
      var unrelated = fixture.AddCredential();
      unrelated.ClientReferent = "unrelated";

      await fixture.Client.DeleteCredential("tenant", ArtifactType.JWS, credential.Id.ToString());
      await fixture.Client.DeleteCredential("tenant", ArtifactType.JWS, credential.Id.ToString());

      Assert.Same(unrelated, Assert.Single(fixture.Credentials));
      fixture.Repository.Verify(repository => repository.Delete(credential), Times.Once);
      Assert.Empty(fixture.Http.CallLog);
    }

    [Fact]
    public async Task ReplayCannotDeleteAnotherHoldersLocalCredential()
    {
      using var fixture = new Fixture();
      var credential = fixture.AddCredential();

      await Assert.ThrowsAsync<DataInconsistencyException>(() =>
        fixture.Client.DeleteCredential("other-holder", ArtifactType.JWS, credential.Id.ToString()));

      Assert.Single(fixture.Credentials);
      fixture.Repository.Verify(repository => repository.Delete(It.IsAny<Infrastructure.AriesCloud.Models.Credential>()), Times.Never);
      Assert.Empty(fixture.Http.CallLog);
    }

    [Fact]
    public async Task ReferentLookupIsScopedToTheHolderAndArtifactType()
    {
      using var fixture = new Fixture();
      var credential = fixture.AddCredential();

      Assert.Null(await fixture.Client.GetCredentialByClientReferentOrNull("other-holder", ArtifactType.JWS, fixture.Request.ClientReferent));
      Assert.Equal(credential.Id.ToString(), (await fixture.Client.GetCredentialByClientReferentOrNull("tenant", ArtifactType.JWS, fixture.Request.ClientReferent))!.Id);
      Assert.Empty(fixture.Http.CallLog);
    }

    [Theory]
    [InlineData(HttpStatusCode.NoContent)]
    [InlineData(HttpStatusCode.NotFound)]
    public async Task AnonCredsDeletionUsesTheTenantClientAndTreatsAbsenceAsSuccess(HttpStatusCode status)
    {
      using var fixture = new Fixture();
      fixture.Http.ForCallsTo("*credentials/*").WithVerb(HttpMethod.Delete).RespondWith(string.Empty, (int)status);

      await fixture.Client.DeleteCredential("tenant", ArtifactType.ACR, "old-holder-credential");

      var deletion = Assert.Single(fixture.Http.CallLog, call => call.Request.Verb == HttpMethod.Delete);
      Assert.EndsWith("/credentials/old-holder-credential", deletion.Request.Url.Path);
      Assert.DoesNotContain(fixture.Http.CallLog, call => call.Request.Url.Path.Contains("connections") || call.Request.Url.Path.Contains("definitions"));
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.Forbidden)]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    public async Task AnonCredsDeletionDoesNotHideProviderFailures(HttpStatusCode status)
    {
      using var fixture = new Fixture();
      fixture.Http.ForCallsTo("*credentials/*").WithVerb(HttpMethod.Delete).RespondWithJson(new { detail = "Provider failure" }, (int)status);

      var error = await Assert.ThrowsAsync<Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException>(() =>
        fixture.Client.DeleteCredential("tenant", ArtifactType.ACR, "old-credential"));

      Assert.Equal(status, error.StatusCode);
    }

    [Fact]
    public async Task AnonCredsSchemaLookupUsesTheExactIdEndpointAndPreservesItsVersion()
    {
      using var fixture = new Fixture();
      fixture.Http.ForCallsTo("*definitions/schemas?*").RespondWithJson(Array.Empty<object>());
      fixture.Http.ForCallsTo("*definitions/schemas/*").RespondWithJson(new
      {
        id = AnonCredsSchemaId,
        name = "YoID|Default",
        version = "1.0",
        attribute_names = AnonCredsAttributeNames
      });

      var result = await fixture.Client.GetSchemaByIdOrNull($" {AnonCredsSchemaId} ");

      Assert.NotNull(result);
      Assert.Equal(AnonCredsSchemaId, result.Id);
      Assert.Equal("YoID|Default", result.Name);
      Assert.Equal(new Version(1, 0), result.Version);
      Assert.Equal(ArtifactType.ACR, result.ArtifactType);
      Assert.Equal(AnonCredsAttributeNames, result.AttributeNames);

      var call = Assert.Single(fixture.Http.CallLog, call => call.Request.Url.Path.Contains("definitions/schemas"));
      Assert.Equal(HttpMethod.Get, call.Request.Verb);
      Assert.EndsWith($"/definitions/schemas/{AnonCredsSchemaId}", Uri.UnescapeDataString(call.Request.Url.ToString()));
      Assert.DoesNotContain("schema_issuer_did", call.Request.Url.ToString());
    }

    [Fact]
    public async Task LocalJwtSchemaLookupDoesNotCallTheProvider()
    {
      using var fixture = new Fixture();

      var result = await fixture.Client.GetSchemaByIdOrNull(" schema-1.0 ");

      Assert.NotNull(result);
      Assert.Equal("schema-1.0", result.Id);
      Assert.Equal(new Version(1, 0), result.Version);
      Assert.Equal(ArtifactType.JWS, result.ArtifactType);
      Assert.Empty(fixture.Http.CallLog);
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.UnprocessableEntity)]
    public async Task MissingProviderSchemaReturnsNull(HttpStatusCode status)
    {
      using var fixture = new Fixture();
      fixture.Http.ForCallsTo("*definitions/schemas/*").RespondWithJson(new { detail = "Schema not found" }, (int)status);

      var result = await fixture.Client.GetSchemaByIdOrNull(AnonCredsSchemaId);

      Assert.Null(result);
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.Forbidden)]
    [InlineData(HttpStatusCode.InternalServerError)]
    [InlineData(HttpStatusCode.ServiceUnavailable)]
    public async Task ProviderSchemaLookupDoesNotHideAuthenticationOrServerFailures(HttpStatusCode status)
    {
      using var fixture = new Fixture();
      fixture.Http.ForCallsTo("*definitions/schemas/*").RespondWithJson(new { detail = "Provider failure" }, (int)status);

      var error = await Assert.ThrowsAsync<Aries.CloudAPI.DotnetSDK.AspCore.Clients.Exceptions.HttpClientException>(
        () => fixture.Client.GetSchemaByIdOrNull(AnonCredsSchemaId));

      Assert.Equal(status, error.StatusCode);
    }

    [Fact]
    public async Task RequiredProviderSchemaLookupStillThrowsWhenTheSchemaIsMissing()
    {
      using var fixture = new Fixture();
      fixture.Http.ForCallsTo("*definitions/schemas/*").RespondWithJson(new { detail = "Schema not found" }, (int)HttpStatusCode.NotFound);

      await Assert.ThrowsAsync<EntityNotFoundException>(() => fixture.Client.GetSchemaById(AnonCredsSchemaId));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public async Task SchemaLookupRejectsMissingIdsWithoutProviderCalls(string? id)
    {
      using var fixture = new Fixture();

      await Assert.ThrowsAsync<ArgumentNullException>(() => fixture.Client.GetSchemaByIdOrNull(id!));

      Assert.Empty(fixture.Http.CallLog);
    }

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
    public async Task LocalJwtDetailReturnsOnlyTheHoldersCredentialWithoutProviderCalls()
    {
      using var fixture = new Fixture();
      var credential = fixture.AddCredential();

      var result = await fixture.Client.GetCredentialById(" tenant ", $" {credential.Id} ");

      Assert.Equal(credential.Id.ToString(), result.Id);
      Assert.Equal(credential.SchemaId, result.SchemaId);
      Assert.Equal("old value", result.Attributes["OldAttribute"]);
      Assert.Empty(fixture.Http.CallLog);
    }

    [Theory]
    [InlineData("other-holder")]
    [InlineData("issuer")]
    [InlineData("TENANT")]
    public async Task LocalJwtDetailCannotBeReadByAnotherHolderOrItsIssuer(string tenantId)
    {
      using var fixture = new Fixture();
      var credential = fixture.AddCredential();
      credential.SourceTenantId = "issuer";

      await Assert.ThrowsAsync<EntityNotFoundException>(
        () => fixture.Client.GetCredentialById(tenantId, credential.Id.ToString()));

      Assert.Empty(fixture.Http.CallLog);
      Assert.Single(fixture.Credentials);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public async Task CredentialDetailRejectsMissingWalletIdsWithoutProviderCalls(string? tenantId)
    {
      using var fixture = new Fixture();
      var credential = fixture.AddCredential();

      await Assert.ThrowsAsync<ArgumentNullException>(
        () => fixture.Client.GetCredentialById(tenantId!, credential.Id.ToString()));

      Assert.Empty(fixture.Http.CallLog);
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
        Repository.Setup(repository => repository.Delete(It.IsAny<Infrastructure.AriesCloud.Models.Credential>()))
          .Returns((Infrastructure.AriesCloud.Models.Credential credential) =>
          {
            Credentials.Remove(credential);
            return Task.CompletedTask;
          });
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
