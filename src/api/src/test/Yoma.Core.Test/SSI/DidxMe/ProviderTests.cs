using Flurl.Http;
using Flurl.Http.Newtonsoft;
using Flurl.Http.Testing;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Security.Claims;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe.Client;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Test.SSI.DidxMe
{
  public class ProviderTests
  {
    #region Class Variables
    private const string CorrelationAttribute = "_Yoma_Credential_ID";
    private const string ReferentAttribute = "_Referent_Client";
    private const string YomaSubjectId = "11111111-1111-1111-1111-111111111111";
    private const string HolderId = "22222222-2222-2222-2222-222222222222";
    private const string WalletId = "33333333-3333-3333-3333-333333333333";
    private const string OrganizationReferent = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    #endregion

    #region Tests
    [Theory]
    [InlineData("MyOpportunity_EntrepreneurshipRegistrationReference")]
    [InlineData("Opportunity_EntrepreneurshipProgrammeOtherDescription")]
    public async Task OversizedCompleteAttributeNamesFailBeforePresetCreation(string attributeName)
    {
      using var http = new HttpTest();
      var fixture = new Fixture(http);
      fixture.PresetMappings.Clear();

      var exception = await Assert.ThrowsAsync<ArgumentException>(() => fixture.Client.UpsertSchema(new SchemaRequest
      {
        Name = "Opportunity|Entrepreneurship|Default",
        ArtifactType = ArtifactType.SDJWT,
        Attributes = ["Opportunity_Title", attributeName]
      }));

      Assert.Contains(attributeName, exception.Message);
      Assert.Contains("maximum is 50", exception.Message);
      Assert.Empty(http.CallLog);
      Assert.Empty(fixture.PresetMappings);
    }

    [Theory]
    [InlineData("Yoma")]
    [InlineData("Partner organisation")]
    public async Task OrganisationTenantCreationRetainsReferentWithoutRemoteProvisioning(string name)
    {
      using var http = new HttpTest();
      var fixture = new Fixture(http);

      var organization = Assert.Single(fixture.Organizations);
      organization.Name = name;
      var request = new TenantRequest
      {
        Referent = " " + organization.NameHashValue + " ",
        Name = name,
        Roles = [Role.Holder, Role.Issuer, Role.Verifier]
      };

      Assert.Equal(OrganizationReferent, await fixture.Client.EnsureTenant(request));
      Assert.Equal(OrganizationReferent, await fixture.Client.EnsureTenant(request));
      Assert.Empty(http.CallLog);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public async Task IssuanceRequiresAnIssuerReferent(string? issuer)
    {
      using var http = new HttpTest();
      var fixture = new Fixture(http);
      var request = fixture.Request();
      request.TenantIdIssuer = issuer!;
      await Assert.ThrowsAnyAsync<ArgumentException>(() => fixture.Client.IssueCredential(request));
      Assert.Empty(http.CallLog);
      Assert.Empty(fixture.IssuanceMappings);
    }

    [Theory]
    [InlineData(ArtifactType.ACR)]
    [InlineData(ArtifactType.JWS)]
    [InlineData((ArtifactType)99)]
    public async Task RejectsUnsupportedArtifactsBeforeRequestsOrMappingWrites(ArtifactType artifactType)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      var request = fixture.Request();
      request.ArtifactType = artifactType;

      Assert.Equal(ArtifactType.SDJWT, fixture.Client.GetDefaultArtifactType(SchemaType.YoID));
      Assert.Equal(ArtifactType.SDJWT, fixture.Client.GetDefaultArtifactType(SchemaType.Opportunity));
      Assert.Throws<NotSupportedException>(() => fixture.Client.GetDefaultArtifactType((SchemaType)99));
      await Assert.ThrowsAsync<NotSupportedException>(() => fixture.Client.UpsertSchema(new SchemaRequest
      {
        Name = "YoID|Default",
        ArtifactType = artifactType,
        Attributes = ["User_DisplayName"]
      }));
      await Assert.ThrowsAsync<NotSupportedException>(() => fixture.Client.IssueCredential(request));
      await Assert.ThrowsAsync<NotSupportedException>(() => fixture.Client.GetCredentialByClientReferentOrNull(
        HolderId, artifactType, request.ClientReferent));
      Assert.Throws<NotSupportedException>(() =>
      {
        _ = fixture.Client.GetCredentialByIdOrNull(HolderId, artifactType, "id");
      });
      Assert.Throws<NotSupportedException>(() =>
      {
        _ = fixture.Client.DeleteCredential(HolderId, artifactType, "id");
      });
      Assert.Empty(http.CallLog);
      Assert.Empty(fixture.IssuanceMappings);
    }

    [Fact]
    public async Task DifferentOrganisationsRetainLocalReferencesButUseTheConfiguredIssuer()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      var partner = new Organization { Id = Guid.NewGuid(), Name = "Partner", NameHashValue = new string('b', 64) };
      fixture.Organizations.Add(partner);
      foreach (var organization in fixture.Organizations)
      {
        var issuerId = await fixture.Client.EnsureTenant(new TenantRequest
        {
          Referent = " " + organization.NameHashValue + " ",
          Name = organization.Name,
          Roles = [Role.Holder, Role.Issuer, Role.Verifier]
        });
        var request = fixture.Request();
        request.TenantIdIssuer = issuerId;
        await fixture.Client.IssueCredential(request);
      }

      Assert.Equal(new[] { OrganizationReferent, partner.NameHashValue }, fixture.IssuanceMappings.Select(item => item.TenantIdIssuer));
      http.ShouldHaveCalled("https://creds.test/api/v1/issuances")
        .WithHeader("Authorization", "Bearer issuer-test").Times(2);
      http.ShouldNotHaveCalled("https://onboarding.test/api/users");
    }

    [Theory]
    [InlineData("YoID|Default")]
    [InlineData("Opportunity|Default")]
    public async Task IssuesBothCredentialFamiliesAsSdJwtAndReturnsStableCorrelation(string schemaName)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      fixture.PresetMappings[0].Name = schemaName;
      var request = fixture.Request();
      request.SchemaName = schemaName;
      var original = new Dictionary<string, string>(request.Attributes);
      var result = await fixture.Client.IssueCredential(request);

      var intent = Assert.Single(fixture.IssuanceMappings);
      Assert.Equal(intent.Id.ToString(), result.Id);
      Assert.NotEqual("issuer-credential-id", result.Id);
      Assert.Equal(HolderId, intent.TenantIdHolder);
      Assert.Equal(OrganizationReferent, intent.TenantIdIssuer);
      Assert.True(intent.DeliveryCompleted);
      Assert.Equal("issuer-credential-id", intent.IssuerCredentialId);
      Assert.Null(intent.WalletCredentialId);
      Assert.Equal(original, result.Attributes);
      Assert.Equal(original, request.Attributes);
      Assert.DoesNotContain(CorrelationAttribute, result.Attributes.Keys);
      http.ShouldHaveCalled("https://creds.test/api/v1/issuances")
        .WithRequestBody($"*{CorrelationAttribute}*{intent.Id}*").Times(1);
      http.ShouldHaveCalled("https://wallet.test/api/v2/orgs/credentials")
        .WithHeader("x-approve-credential", "true").Times(1);
      var delivery = JObject.Parse(http.CallLog.Single(call => call.Request.Url.Path.EndsWith("/orgs/credentials")).RequestBody);
      Assert.Equal(YomaSubjectId, delivery.Value<string>("recipient"));
      Assert.Equal("externalIdentifier", delivery.Value<string>("identifierType"));
      http.ShouldHaveCalled($"https://onboarding.test/api/users/by-external-identifier/{YomaSubjectId}").Times(1);
    }

    [Fact]
    public async Task IntentIsSavedBeforeIssuanceAndFailureDoesNotReportDeliverySuccess()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.ForCallsTo("https://wallet.test/api/v2/orgs/credentials").RespondWith(status: 503);
      var fixture = new Fixture(http);
      await Assert.ThrowsAsync<HttpClientException>(() => fixture.Client.IssueCredential(fixture.Request()));
      var intent = Assert.Single(fixture.IssuanceMappings);
      Assert.Equal("issuer-credential-id", intent.IssuerCredentialId);
      Assert.False(intent.DeliveryCompleted);
      http.ShouldHaveCalled("https://creds.test/api/v1/issuances").Times(1);
      http.ShouldHaveCalled("https://wallet.test/api/v2/orgs/credentials").Times(1);
    }

    [Fact]
    public async Task FailedIntentPersistencePreventsExternalIssuance()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      fixture.IssuanceMappingRepository.Setup(repository => repository.Create(It.IsAny<IssuanceMapping>()))
        .ThrowsAsync(new InvalidOperationException("database unavailable"));
      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Client.IssueCredential(fixture.Request()));
      http.ShouldNotHaveCalled("https://creds.test/api/v1/issuances");
      http.ShouldNotHaveCalled("https://wallet.test/api/v2/orgs/credentials");
    }

    [Theory]
    [InlineData("schema")]
    [InlineData("artifact")]
    [InlineData("attribute")]
    [InlineData("referent")]
    public async Task RejectsInconsistentIssuanceBeforeRemoteMutation(string mismatch)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      var request = fixture.Request();
      switch (mismatch)
      {
        case "schema": request.SchemaName = "Other"; break;
        case "artifact": fixture.PresetMappings[0].ArtifactType = ArtifactType.ACR; break;
        case "attribute": request.Attributes.Add("Unknown", "value"); break;
        case "referent": request.Attributes[ReferentAttribute] = "other"; break;
        default: throw new NotSupportedException();
      }
      await Assert.ThrowsAsync<ArgumentException>(() => fixture.Client.IssueCredential(request));
      Assert.Empty(fixture.IssuanceMappings);
      http.ShouldNotHaveCalled("https://creds.test/api/v1/issuances");
    }

    [Fact]
    public async Task WalletPaginationUsesOnlyCursorAndMapsWalletIdToStableId()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      var issued = await fixture.Client.IssueCredential(fixture.Request());
      var next = "https://untrusted.test/steal?page%5Bafter%5D=next-page";
      http.ForCallsTo("https://wallet.test/api/v2/credentials*")
        .RespondWith(JsonConvert.SerializeObject(new { data = Array.Empty<object>(), links = new { next } }))
        .RespondWith(JsonConvert.SerializeObject(new { data = new[] { fixture.WalletCredential(issued.Id) }, links = new { } }));

      var result = Assert.Single((await fixture.Client.ListCredentials(HolderId))!);
      Assert.Equal(issued.Id, result.Id);
      Assert.Equal(issued.SchemaId, result.SchemaId);
      Assert.Equal(issued.Attributes, result.Attributes);
      Assert.Equal(WalletId, Assert.Single(fixture.IssuanceMappings).WalletCredentialId);
      Assert.Equal("[\"C#\",\"English\"]", result.Attributes["Skills"]);
      Assert.DoesNotContain(CorrelationAttribute, result.Attributes.Keys);
      http.ShouldNotHaveCalled("https://untrusted.test/*");
      http.ShouldHaveCalled("https://wallet.test/api/v2/credentials*")
        .WithQueryParam("page[after]", "next-page").Times(1);
    }

    [Fact]
    public async Task MappedCredentialReadUsesTheDidxMeHolderId()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      var issued = await fixture.Client.IssueCredential(fixture.Request());
      Assert.Single(fixture.IssuanceMappings).WalletCredentialId = WalletId;
      http.ForCallsTo($"https://wallet.test/api/v2/credentials/{WalletId}")
        .RespondWith(JsonConvert.SerializeObject(new { data = fixture.WalletCredential(issued.Id) }));

      var result = await fixture.Client.GetCredentialById(HolderId, issued.Id);

      Assert.Equal(issued.Id, result.Id);
      Assert.Equal(issued.Attributes, result.Attributes);
      http.ShouldHaveCalled($"https://wallet.test/api/v2/credentials/{WalletId}").Times(1);
    }

    [Fact]
    public async Task RejectsRepeatingWalletCursorInsteadOfReturningPartialResults()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      http.ForCallsTo("https://wallet.test/api/v2/credentials*").RespondWithJson(new
      {
        data = Array.Empty<object>(),
        links = new { next = "/v2/credentials?page%5Bafter%5D=repeat" }
      });
      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Client.ListCredentials(HolderId));
    }

    [Fact]
    public async Task CannotReadAnotherParticipantsWallet()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      await Assert.ThrowsAsync<UnauthorizedAccessException>(() => fixture.Client.ListCredentials(Guid.NewGuid().ToString()));
      http.ShouldNotHaveCalled("https://wallet.test/*");
    }

    [Fact]
    public async Task YomaSubjectCannotBeUsedAsTheWalletTenantId()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);

      await Assert.ThrowsAsync<UnauthorizedAccessException>(() => fixture.Client.ListCredentials(YomaSubjectId));

      http.ShouldHaveCalled($"https://onboarding.test/api/users/by-external-identifier/{YomaSubjectId}").Times(1);
      http.ShouldNotHaveCalled("https://wallet.test/*");
    }

    [Theory]
    [InlineData("missing-tenant")]
    [InlineData("missing-user")]
    [InlineData("missing-subject")]
    [InlineData("changed-holder")]
    public async Task IssuanceRequiresTheStoredHolderToMatchTheTrustedParticipant(string mismatch)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      // Register before the fixture's default response: Flurl matches setups in registration order.
      if (mismatch == "changed-holder")
        http.ForCallsTo("https://onboarding.test/api/users/by-external-identifier/*")
          .RespondWithJson(new { data = new { id = Guid.NewGuid(), username = "other-holder", enabled = true } });

      var fixture = new Fixture(http);
      switch (mismatch)
      {
        case "missing-tenant": fixture.TenantCreations.Clear(); break;
        case "missing-user": fixture.Users.Clear(); break;
        case "missing-subject": fixture.Users[0].ExternalId = null; break;
        case "changed-holder": break;
        default: throw new NotSupportedException();
      }

      var exception = await Record.ExceptionAsync(() => fixture.Client.IssueCredential(fixture.Request()));

      Assert.NotNull(exception);
      if (mismatch == "missing-user") Assert.IsType<EntityNotFoundException>(exception);
      else Assert.IsType<InvalidOperationException>(exception);
      Assert.Empty(fixture.IssuanceMappings);
      http.ShouldNotHaveCalled("https://creds.test/*");
      http.ShouldNotHaveCalled("https://wallet.test/*");
    }

    [Fact]
    public async Task RejectsWalletCorrelationOwnedByAnotherParticipant()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      var issued = await fixture.Client.IssueCredential(fixture.Request());
      Assert.Single(fixture.IssuanceMappings).TenantIdHolder = Guid.NewGuid().ToString();
      http.ForCallsTo("https://wallet.test/api/v2/credentials*").RespondWith(
        JsonConvert.SerializeObject(new { data = new[] { fixture.WalletCredential(issued.Id) }, links = new { } }));

      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Client.ListCredentials(HolderId));
      Assert.Null(Assert.Single(fixture.IssuanceMappings).WalletCredentialId);
    }

    [Fact]
    public async Task MissingMappedWalletCredentialRetainsDomainNotFoundBehavior()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      var issued = await fixture.Client.IssueCredential(fixture.Request());
      Assert.Single(fixture.IssuanceMappings).WalletCredentialId = WalletId;
      http.ForCallsTo($"https://wallet.test/api/v2/credentials/{WalletId}").RespondWith(status: 404);

      await Assert.ThrowsAsync<EntityNotFoundException>(() => fixture.Client.GetCredentialById(HolderId, issued.Id));

      http.ShouldHaveCalled($"https://wallet.test/api/v2/credentials/{WalletId}").Times(1);
    }

    [Theory]
    [InlineData("preset-read")]
    [InlineData("issuance")]
    [InlineData("delivery")]
    [InlineData("holder-read")]
    [InlineData("holder-create")]
    [InlineData("holder-link")]
    public async Task OtherIssuerOperationsDoNotSuppressConflictsOrRetry(string operation)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.RespondWith("Unexpected conflict", 409);
      var auth = new Mock<IIssuerAuthService>();
      auth.Setup(service => service.GetAuthHeader(It.IsAny<CancellationToken>()))
        .ReturnsAsync(new KeyValuePair<string, string>("Authorization", "Bearer issuer-test"));
      var client = new IssuerClient(Options.Create(new ProviderOptions
      {
        CredentialsBaseUri = "https://creds.test/api",
        WalletBaseUri = "https://wallet.test/api",
        OnboardingBaseUri = "https://onboarding.test/api"
      }), auth.Object);
      Func<Task> action = operation switch
      {
        "preset-read" => () => client.GetPreset("~yoma:existing"),
        "issuance" => () => client.Issue("~yoma:existing", []),
        "delivery" => () => client.Deliver(YomaSubjectId, "openid-credential-offer://offer"),
        "holder-read" => () => client.GetHolderOrNull(YomaSubjectId),
        "holder-create" => () => client.CreateHolder(YomaSubjectId, "yoma-holder", null, null),
        "holder-link" => () => client.EnableHolderLink("yoma-holder"),
        _ => throw new NotSupportedException()
      };

      var exception = await Assert.ThrowsAsync<HttpClientException>(action);

      Assert.Equal(HttpStatusCode.Conflict, exception.StatusCode);
      Assert.Equal("Unexpected conflict", exception.Message);
      Assert.Single(http.CallLog);
      auth.Verify(service => service.Invalidate(), Times.Never());
    }

    [Fact]
    public async Task ExistingPresetIsRecoveredWithoutAnHttpException()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      fixture.PresetMappings.Clear();
      var hash = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(
        JsonConvert.SerializeObject(new[] { "yoma", "YoID|Default", "1.0" }))));
      var code = $"yoma-{hash[..40]}";
      var presetId = $"~yoma:{code}";
      http.ForCallsTo("https://creds.test/api/v1/presets/credentials")
        .RespondWith("Conflict", 409);
      http.ForCallsTo("https://creds.test/api/v1/presets/credentials/*")
        .RespondWithJson(new
        {
          data = new
          {
            id = presetId,
            author = "yoma",
            code,
            credentialFormat = "sd-jwt",
            templateName = "YoID|Default",
            templateType = $"https://types.test/{code}",
            templateAttributes = new Dictionary<string, object>
            {
              ["Name"] = new { type = "string", required = false, alwaysDisclosed = false },
              [CorrelationAttribute] = new { type = "string", required = true, alwaysDisclosed = false }
            }
          }
        });

      var schema = await fixture.Client.UpsertSchema(new SchemaRequest
      {
        Name = "YoID|Default",
        ArtifactType = ArtifactType.SDJWT,
        Attributes = ["Name"]
      });

      Assert.Equal(new Version(1, 0), schema.Version);
      Assert.Equal(presetId, Assert.Single(fixture.PresetMappings).PresetId);
      Assert.All(http.CallLog, call => Assert.Null(call.Exception));
      http.ShouldHaveCalled("https://creds.test/api/v1/presets/credentials").WithVerb(HttpMethod.Post).Times(1);
      http.ShouldHaveCalled("https://creds.test/api/v1/presets/credentials/*").WithVerb(HttpMethod.Get).Times(1);
    }

    [Theory]
    [InlineData(401)]
    [InlineData(403)]
    [InlineData(500)]
    public async Task PresetCreationFailuresAreNotTreatedAsExistingPresets(int status)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      fixture.PresetMappings.Clear();
      http.ForCallsTo("https://creds.test/api/v1/presets/credentials").RespondWith(status: status);

      var exception = await Assert.ThrowsAsync<HttpClientException>(() => fixture.Client.UpsertSchema(new SchemaRequest
      {
        Name = "YoID|Default",
        ArtifactType = ArtifactType.SDJWT,
        Attributes = ["Name"]
      }));

      Assert.Equal((HttpStatusCode)status, exception.StatusCode);
      fixture.IssuerAuth.Verify(service => service.Invalidate(), status == 401 ? Times.Once() : Times.Never());
      Assert.Empty(fixture.PresetMappings);
      http.ShouldNotHaveCalled("https://creds.test/api/v1/presets/credentials/*");
      http.ShouldHaveCalled("https://creds.test/api/v1/presets/credentials").Times(1);
    }

    [Fact]
    public async Task ConflictingRemotePresetMustMatchBeforeItsMappingIsSaved()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      fixture.PresetMappings.Clear();
      http.ForCallsTo("https://creds.test/api/v1/presets/credentials").RespondWith(status: 409);
      http.ForCallsTo("https://creds.test/api/v1/presets/credentials/*")
        .RespondWithJson(new { data = new { id = "different-preset", credentialFormat = "sd-jwt" } });

      await Assert.ThrowsAsync<InvalidOperationException>(() => fixture.Client.UpsertSchema(new SchemaRequest
      {
        Name = "YoID|Default",
        ArtifactType = ArtifactType.SDJWT,
        Attributes = ["Name"]
      }));
      Assert.Empty(fixture.PresetMappings);
      http.ShouldHaveCalled("https://creds.test/api/v1/presets/credentials/*").WithVerb(HttpMethod.Get).Times(1);
    }

    [Fact]
    public async Task HolderOnboardingUsesTrustedExternalIdAndDoesNotSendEmail()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.ForCallsTo("https://onboarding.test/api/users/by-external-identifier/*")
        .RespondWith(status: 404)
        .RespondWithJson(new { data = new { id = HolderId, username = "yoma-holder", enabled = true } });
      var fixture = new Fixture(http);
      var user = new User { Id = Guid.NewGuid(), ExternalId = Guid.Parse(YomaSubjectId) };
      fixture.Users.Add(user);
      http.ForCallsTo("https://onboarding.test/api/users").RespondWithJson(new { data = new { } }, 201);
      http.ForCallsTo("https://onboarding.test/api/users/yoma-holder/idp-link")
        .RespondWithJson(new { data = new { username = "yoma-holder", linked = true } });
      var result = await fixture.Client.EnsureTenant(new TenantRequest
      {
        Referent = user.Id.ToString(),
        Name = "Participant",
        Roles = [Role.Holder]
      });
      Assert.Equal(HolderId, result);
      var body = JObject.Parse(http.CallLog.Single(call => call.Request.Url.Path.EndsWith("/users")).RequestBody);
      Assert.Equal(YomaSubjectId, body.Value<string>("externalIdentifier"));
      Assert.False(body.Value<bool>("sendOnboardingEmail"));
      Assert.Null(body["email"]);
      Assert.Null(body["firstName"]);
      Assert.Null(body["lastName"]);
      Assert.Null(body["Username"]);
      Assert.All(http.CallLog, call => Assert.Null(call.Exception));
      Assert.Equal(HolderId, await fixture.Client.EnsureTenant(new TenantRequest
      {
        Referent = user.Id.ToString(),
        Name = "Participant",
        Roles = [Role.Holder]
      }));
      http.ShouldHaveCalled("https://onboarding.test/api/users").WithVerb(HttpMethod.Post).Times(1);
    }

    [Theory]
    [InlineData(4)]
    [InlineData(50)]
    public async Task PresetVersioningRetainsSdJwtArtifactType(int attributeLength)
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      var fixture = new Fixture(http);
      fixture.PresetMappings.Clear();
      var attributeName = new string('A', attributeLength);
      var presets = http.ForCallsTo("https://creds.test/api/v1/presets/credentials");
      foreach (var (artifact, version) in new[] { (ArtifactType.SDJWT, "1.0"), (ArtifactType.SDJWT, "1.1") })
      {
        var hash = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(
          JsonConvert.SerializeObject(new[] { "yoma", "YoID|Default", version }))));
        var code = $"yoma-{hash[..40]}";
        presets.RespondWithJson(new
        {
          data = new
          {
            id = $"~yoma:{code}",
            author = "yoma",
            code,
            credentialFormat = "sd-jwt",
            templateName = "YoID|Default",
            templateType = $"https://types.test/{code}",
            templateAttributes = new Dictionary<string, object>
            {
              [attributeName] = new { type = "string", required = false, alwaysDisclosed = false },
              [CorrelationAttribute] = new { type = "string", required = true, alwaysDisclosed = false }
            }
          }
        });
      }
      foreach (var (artifact, version) in new[] { (ArtifactType.SDJWT, "1.0"), (ArtifactType.SDJWT, "1.1") })
      {
        var schema = await fixture.Client.UpsertSchema(new SchemaRequest
        {
          Name = "YoID|Default",
          ArtifactType = artifact,
          Attributes = [attributeName]
        });
        Assert.Equal(Version.Parse(version), schema.Version);
        Assert.Equal(artifact, schema.ArtifactType);
        Assert.Equal(new[] { attributeName }, schema.AttributeNames);
      }
      Assert.Equal(2, (await fixture.Client.ListSchemas(false))!.Count);
      Assert.Equal(new Version(1, 1), Assert.Single((await fixture.Client.ListSchemas(true))!).Version);
      http.ShouldHaveCalled("https://creds.test/api/v1/presets/credentials")
        .WithRequestBody("*\"credentialFormat\":\"sd-jwt\"*").Times(2);

      foreach (var call in http.CallLog.Where(call => call.Request.Url.Path.EndsWith("/presets/credentials")))
      {
        var body = JObject.Parse(call.RequestBody);
        Assert.Equal("private", body.Value<string>("namespace"));
        Assert.Equal("YoID|Default", body.Value<string>("templateName"));
        Assert.Equal("Yoma credential preset: YoID|Default", body.Value<string>("templateDescription"));
        var attributes = Assert.IsType<JObject>(body["templateAttributes"]);
        Assert.Equal(attributeName, attributes[attributeName]!.Value<string>("name"));
        Assert.Equal("string", attributes[attributeName]!.Value<string>("type"));
        Assert.False(attributes[attributeName]!.Value<bool>("required"));
        Assert.False(attributes[attributeName]!.Value<bool>("alwaysDisclosed"));
        Assert.True(attributes[CorrelationAttribute]!.Value<bool>("required"));
        Assert.Null(body["TemplateAttributes"]);
      }
    }

    [Fact]
    public async Task IssuerUnauthorizedInvalidatesWithoutRetryingMutation()
    {
      using var http = new HttpTest()
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());
      http.ForCallsTo("https://creds.test/api/v1/issuances").RespondWith(status: 401);
      var fixture = new Fixture(http);
      await Assert.ThrowsAsync<HttpClientException>(() => fixture.Client.IssueCredential(fixture.Request()));
      fixture.IssuerAuth.Verify(service => service.Invalidate(), Times.Once);
      http.ShouldHaveCalled("https://creds.test/api/v1/issuances").Times(1);
    }
    #endregion

    #region Fixtures
    private sealed class Fixture
    {
      public readonly List<CredentialPresetMapping> PresetMappings = [];
      public readonly List<IssuanceMapping> IssuanceMappings = [];
      public readonly List<User> Users = [];
      public readonly List<Organization> Organizations = [];
      public readonly List<SSITenantCreation> TenantCreations = [];
      public readonly Mock<IRepository<IssuanceMapping>> IssuanceMappingRepository;
      public readonly Mock<IIssuerAuthService> IssuerAuth = new();
      public readonly ProviderClient Client;
      private readonly ArtifactType _artifactType;

      public Fixture(HttpTest http, ArtifactType artifactType = ArtifactType.SDJWT)
      {
        _artifactType = artifactType;
        Organizations.Add(new Organization { Id = Guid.NewGuid(), Name = "Yoma", NameHashValue = OrganizationReferent });
        var user = new User { Id = Guid.NewGuid(), ExternalId = Guid.Parse(YomaSubjectId) };
        Users.Add(user);
        TenantCreations.Add(new SSITenantCreation { UserId = user.Id, TenantId = HolderId });
        var options = Options.Create(new ProviderOptions
        {
          TenantAlias = "yoma",
          CredentialsBaseUri = "https://creds.test/api",
          WalletBaseUri = "https://wallet.test/api",
          OnboardingBaseUri = "https://onboarding.test/api"
        });
        PresetMappings.Add(new CredentialPresetMapping
        {
          Id = "schema-1",
          TenantAlias = "yoma",
          Name = "Opportunity|Default",
          Version = "1.0",
          ArtifactType = artifactType,
          AttributeNames = JsonConvert.SerializeObject(new[] { ReferentAttribute, "Skills", "DateIssued" }),
          PresetId = "~yoma:opportunity-v1",
          Vct = "https://types.test/opportunity-v1"
        });
        var presetMappingRepository = Repository(PresetMappings);
        IssuanceMappingRepository = Repository(IssuanceMappings);
        var users = new Mock<IRepositoryValueContainsWithNavigation<User>>();
        users.Setup(repository => repository.Query(false)).Returns(() => Users.AsQueryable());
        IssuerAuth.Setup(service => service.GetAuthHeader(It.IsAny<CancellationToken>()))
          .ReturnsAsync(new KeyValuePair<string, string>("Authorization", "Bearer issuer-test"));
        var holderAuth = new Mock<IHolderAuthService>();
        holderAuth.Setup(service => service.GetAuthHeader(It.IsAny<HolderContext>(), It.IsAny<CancellationToken>()))
          .ReturnsAsync(new KeyValuePair<string, string>("Authorization", "Bearer holder-test"));
        var context = new DefaultHttpContext
        {
          User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", YomaSubjectId)], "Bearer"))
        };
        context.Request.Headers.Authorization = "Bearer source-test";
        var accessor = new HttpContextAccessor { HttpContext = context };
        var issuer = new IssuerClient(options, IssuerAuth.Object);
        Client = new ProviderClient(options, new PresetService(options, presetMappingRepository.Object, issuer), issuer,
          new WalletClient(options, holderAuth.Object), new HolderContextService(accessor, issuer),
          new BackgroundWalletService(), IssuanceMappingRepository.Object, users.Object, Repository(TenantCreations).Object);
        http.ForCallsTo("https://onboarding.test/api/users/by-external-identifier/*")
          .RespondWithJson(new { data = new { id = HolderId, username = "yoma-holder", enabled = true } });
        http.ForCallsTo("https://creds.test/api/v1/issuances").RespondWithJson(new
        {
          data = new
          {
            id = "issuance-id",
            status = "offered",
            offerUri = "openid-credential-offer://offer",
            credentials = new[] { new { id = "issuer-credential-id", format = "sd-jwt-vc" } }
          }
        }, 201);
        http.ForCallsTo("https://wallet.test/api/v2/orgs/credentials").RespondWithJson(new { data = (object?)null }, 201);
      }

      public CredentialIssuanceRequest Request() => new()
      {
        SchemaId = "schema-1",
        SchemaName = "Opportunity|Default",
        SchemaType = "Opportunity",
        ArtifactType = _artifactType,
        TenantIdIssuer = OrganizationReferent,
        TenantIdHolder = HolderId,
        ClientReferent = new(ReferentAttribute, "scheduled-issuance"),
        Attributes = new()
        {
          [ReferentAttribute] = "scheduled-issuance",
          ["Skills"] = "[\"C#\",\"English\"]",
          ["DateIssued"] = "2026-11-02T00:00:00+00:00"
        }
      };

      public object WalletCredential(string id) => new
      {
        id = WalletId,
        format = "vc+sd-jwt",
        vct = "https://types.test/opportunity-v1",
        status = "accepted",
        iat = "2026-11-02T00:00:00Z",
        claims = new Dictionary<string, string>
        {
          [CorrelationAttribute] = id,
          [ReferentAttribute] = "scheduled-issuance",
          ["Skills"] = "[\"C#\",\"English\"]",
          ["DateIssued"] = "2026-11-02T00:00:00+00:00"
        }
      };

      private static Mock<IRepository<T>> Repository<T>(List<T> items) where T : class
      {
        var repository = new Mock<IRepository<T>>();
        repository.Setup(value => value.Query()).Returns(() => items.AsQueryable());
        repository.Setup(value => value.Create(It.IsAny<T>())).ReturnsAsync((T item) => { items.Add(item); return item; });
        repository.Setup(value => value.Update(It.IsAny<T>())).ReturnsAsync((T item) => item);
        return repository;
      }
    }
    #endregion
  }
}
