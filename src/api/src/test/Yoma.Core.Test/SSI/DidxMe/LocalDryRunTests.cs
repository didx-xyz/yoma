using Flurl;
using Flurl.Http;
using Flurl.Http.Newtonsoft;
using Keycloak.AuthServices.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using Newtonsoft.Json.Linq;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Api.Controllers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.IdentityProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Payout.Interfaces;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Provider;
using Yoma.Core.Infrastructure.DidxMe;
using Yoma.Core.Infrastructure.DidxMe.Context;
using Yoma.Core.Infrastructure.DidxMe.Interfaces;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces;
using Yoma.Core.Infrastructure.Keycloak;
using Yoma.Core.Infrastructure.Shared;

namespace Yoma.Core.Test.SSI.DidxMe
{
  /// <summary>
  /// Explicit local-only smoke, excluded from ordinary test runs. Requires the standalone mono
  /// stack, imported Yoma realm and an isolated scratch PostgreSQL database; see the epic runbook.
  /// Real external credentials are read from ignored settings and never included in test output.
  /// </summary>
  public class LocalDryRunTests
  {
    #region Tests
    [Fact(Explicit = true)]
    public async Task OnboardsIssuesBothCredentialFamiliesAndReadsTheHolderWallet()
    {
      if (Environment.GetEnvironmentVariable("YOMA_DIDXME_LOCAL_DRY_RUN") != "1")
        throw new InvalidOperationException("Explicit local dry-run opt-in is required; consult the environment runbook");

      // Match the API host's ConfigureFlurl defaults when exercising the adapter outside that host.
      FlurlHttp.Clients.WithDefaults(builder => builder.Settings.JsonSerializer = new NewtonsoftJsonSerializer());

      var settingsPath = Environment.GetEnvironmentVariable("YOMA_DIDXME_LOCAL_SETTINGS");
      if (string.IsNullOrWhiteSpace(settingsPath) || !Path.IsPathFullyQualified(settingsPath))
        throw new InvalidOperationException("An absolute path to ignored Local settings is required");
      var configuration = new ConfigurationBuilder()
        .AddJsonFile(settingsPath)
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
          ["ConnectionStrings:SQLConnection"] =
            "Host=localhost;Port=15439;Database=yoma-didxme-dryrun;Username=postgres;Password=localDryRunOnly;Include Error Detail=false"
        })
        .Build();
      var options = configuration.GetSection(ProviderOptions.Section).Get<ProviderOptions>()
        ?? throw new InvalidOperationException("DidxMe settings are missing");
      var identityOptions = configuration.GetSection(KeycloakAuthenticationOptions.Section).Get<KeycloakAuthenticationOptions>()
        ?? throw new InvalidOperationException("Identity-provider settings are missing");
      ArgumentException.ThrowIfNullOrWhiteSpace(identityOptions.AuthServerUrl);
      foreach (var url in new[] { options.KeycloakBaseUri, identityOptions.AuthServerUrl,
        options.WalletBaseUri, options.CredentialsBaseUri, options.OnboardingBaseUri })
      {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || !uri.IsLoopback)
          throw new InvalidOperationException("This dry run permits only local platform endpoints");
      }
      if (options.TenantAlias != "yoma" || identityOptions.Realm != "yoma")
        throw new InvalidOperationException("This dry run requires the prepared local Yoma tenant and realm");

      var users = new List<User>();
      var organization = new Organization { Id = Guid.NewGuid(), Name = "Local Dry Run Organisation", NameHashValue = "yoma-local-dryrun-org" };
      var tenants = new List<SSITenantCreation>();
      var tenantRepository = new Mock<IRepository<SSITenantCreation>>();
      tenantRepository.Setup(repository => repository.Query()).Returns(() => tenants.AsQueryable());
      var userRepository = new Mock<IRepositoryValueContainsWithNavigation<User>>();
      userRepository.Setup(repository => repository.Query(false)).Returns(() => users.AsQueryable());
      var accessor = new HttpContextAccessor();
      var services = new ServiceCollection();
      services.AddLogging();
      // Protocol dry run uses an isolated cache/key ring; cross-replica reuse is covered separately.
      var tokenCache = new HolderTokenCacheFixture();
      services.AddSingleton(tokenCache.Cache.Object);
      services.AddSingleton(tokenCache.Lock.Object);
      services.AddSingleton(tokenCache.Encryption);
      services.AddSingleton<IHttpContextAccessor>(accessor);
      services.AddSingleton(userRepository.Object);
      services.AddSingleton(tenantRepository.Object);
      services.ConfigureServices_IdentityProvider(configuration);
      services.ConfigureServices_InfrastructureIdentityProvider();
      services.AddSingleton(Mock.Of<IEnvironmentProvider>());
      services.AddOptions<AppSettings>();
      services.ConfigureServices_InfrastructureShared();
      services.ConfigureServices_InfrastructureSSIProvider(configuration, new AppSettings
      {
        DatabaseRetryPolicy = new AppSettingsDatabaseRetryPolicy
        {
          MaxRetryCount = 2,
          MaxRetryDelayInSeconds = 2
        }
      });
      await using var provider = services.BuildServiceProvider(new ServiceProviderOptions
      {
        ValidateOnBuild = true,
        ValidateScopes = true
      });
      provider.Configure_InfrastructureDatabaseSSIProvider();
      // Repeat migration startup to verify a retained local database is safe to reuse.
      provider.Configure_InfrastructureDatabaseSSIProvider();
      var receiverBuilder = WebApplication.CreateBuilder();
      receiverBuilder.Logging.ClearProviders();
      receiverBuilder.WebHost.UseUrls("http://0.0.0.0:5114");
      await using var receiver = receiverBuilder.Build();
      receiver.MapPost("/api/v3/webhook/didxme", async (HttpContext context) =>
      {
        await using var webhookScope = provider.CreateAsyncScope();
        var controller = new WebhookController(
          NullLogger<WebhookController>.Instance, Options.Create(new AppSettings()),
          Mock.Of<IIdempotencyService>(), tokenCache.Lock.Object,
          webhookScope.ServiceProvider.GetRequiredService<IIdentityProviderClientFactory>(),
          Mock.Of<IUserService>(), Mock.Of<IGenderService>(), Mock.Of<ICountryService>(),
          Mock.Of<IEducationService>(), Mock.Of<IWalletService>(), Mock.Of<IPayoutService>(),
          Mock.Of<IYellowCardWebhookParser>(),
          webhookScope.ServiceProvider.GetRequiredService<IWebhookParser>(),
          webhookScope.ServiceProvider.GetRequiredService<IIssuanceTrackingService>())
        {
          ControllerContext = new ControllerContext { HttpContext = context }
        };
        var result = await controller.ReceiveDidxMeWebhook();
        return Results.StatusCode(((StatusCodeResult)result).StatusCode);
      });
      await receiver.StartAsync(TestContext.Current.CancellationToken);
      await using var scope = provider.CreateAsyncScope();
      Assert.False(scope.ServiceProvider.GetRequiredService<ProviderDbContext>().Database.HasPendingModelChanges());
      var client = scope.ServiceProvider.GetRequiredService<ISSIProviderClientFactory>().CreateClient();
      var adminBase = identityOptions.AuthServerUrl.AppendPathSegments("admin", "realms", "yoma").ToString();
      var yomaAdmin = await Token(identityOptions.AuthServerUrl, "master", new
      {
        grant_type = "password",
        client_id = "admin-cli",
        username = "admin",
        password = "password"
      });
      string? subject = null;
      HolderContext? holderContext = null;
      var walletIds = new HashSet<string>();
      var username = $"yoma-dryrun-{Guid.NewGuid():N}@example.invalid";
      var password = "Local1-" + Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(24));
      try
      {
        await Request(adminBase.AppendPathSegment("users"), yomaAdmin).PostJsonAsync(new
        {
          username,
          email = username,
          firstName = "Yoma",
          lastName = "Local Dry Run",
          emailVerified = true,
          enabled = true,
          requiredActions = Array.Empty<string>(),
          credentials = new[] { new { type = "password", value = password, temporary = false } }
        }, cancellationToken: TestContext.Current.CancellationToken);
        var identities = await Request(adminBase.AppendPathSegment("users"), yomaAdmin)
          .SetQueryParams(new { username, exact = true }).GetJsonAsync<JArray>(cancellationToken: TestContext.Current.CancellationToken);
        subject = identities.Single().Value<string>("id")!;
        var user = new User
        {
          Id = Guid.NewGuid(),
          ExternalId = Guid.Parse(subject),
          FirstName = "Yoma",
          Surname = "Local Dry Run"
        };
        users.Add(user);
        var tenantId = await client.EnsureTenant(new TenantRequest
        {
          Referent = user.Id.ToString(),
          Name = "Local Dry Run",
          Roles = [Role.Holder]
        });
        var holder = await scope.ServiceProvider.GetRequiredService<IIssuerClient>().GetHolderOrNull(subject);
        Assert.NotNull(holder);
        Assert.Equal(holder.Id, tenantId);
        tenants.Add(new SSITenantCreation { UserId = user.Id, TenantId = tenantId });
        Assert.Equal(tenantId, await client.EnsureTenant(new TenantRequest
        {
          Referent = user.Id.ToString(),
          Name = "Local Dry Run",
          Roles = [Role.Holder]
        }));

        var web = await Request(adminBase.AppendPathSegment("clients"), yomaAdmin)
          .SetQueryParam("clientId", "yoma-web").GetJsonAsync<JArray>(cancellationToken: TestContext.Current.CancellationToken);
        var webSecret = await Request(adminBase.AppendPathSegments("clients", web.Single().Value<string>("id"), "client-secret"), yomaAdmin)
          .GetJsonAsync<JObject>(cancellationToken: TestContext.Current.CancellationToken);
        var userToken = await Token(identityOptions.AuthServerUrl, "yoma", new
        {
          grant_type = "password",
          client_id = "yoma-web",
          client_secret = webSecret.Value<string>("value"),
          username,
          password
        });
        accessor.HttpContext = new DefaultHttpContext
        {
          // This fixture obtained the subject directly from the authenticated local Keycloak.
          // Production relies on Yoma's existing signature-validating bearer middleware.
          User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", subject)], "Bearer"))
        };
        accessor.HttpContext.Request.Headers.Authorization = $"Bearer {userToken}";
        holderContext = await scope.ServiceProvider.GetRequiredService<IHolderService>().GetContext(tenantId);
        var issuerTenantId = await client.EnsureTenant(new TenantRequest
        {
          Referent = organization.NameHashValue,
          Name = organization.Name,
          Roles = [Role.Holder, Role.Issuer, Role.Verifier]
        });
        Assert.Equal(organization.NameHashValue, issuerTenantId);

        var issued = new List<Credential>();
        foreach (var (schemaType, artifact) in new[] { ("YoID", ArtifactType.SDJWT), ("Opportunity", ArtifactType.SDJWT) })
        {
          var name = $"{schemaType}|DidxMeLocalDryRun";
          var schema = await client.GetSchemaByNameOrNull(name) ?? await client.UpsertSchema(new SchemaRequest
          {
            Name = name,
            ArtifactType = artifact,
            Attributes = ["_Referent_Client", "_Date_Issued", "Issuer", "Name", "Skills", "Optional"]
          });
          Assert.Equal(artifact, schema.ArtifactType);
          var referent = Guid.NewGuid().ToString();
          var request = new CredentialIssuanceRequest
          {
            SchemaId = schema.Id,
            SchemaName = name,
            SchemaType = schemaType,
            ArtifactType = artifact,
            TenantIdHolder = tenantId,
            TenantIdIssuer = issuerTenantId,
            ClientReferent = new("_Referent_Client", referent),
            Attributes = new()
            {
              ["_Referent_Client"] = referent,
              ["_Date_Issued"] = "2026-11-02T00:00:00+00:00",
              ["Issuer"] = "Yoma Local Dry Run",
              ["Name"] = $"Synthetic {schemaType} participant",
              ["Skills"] = "[\"Learning\",\"Testing\"]"
            }
          };
          var credential = await client.IssueCredential(request);
          Assert.Equal(schema.Id, credential.SchemaId);
          Assert.Equal(request.Attributes, credential.Attributes);
          issued.Add(credential);
        }

        var wallet = (await client.ListCredentials(tenantId))!;
        foreach (var expected in issued)
        {
          var actual = Assert.Single(wallet, item => item.Id == expected.Id);
          Assert.Equal(expected.SchemaId, actual.SchemaId);
          Assert.Equal(expected.Attributes, actual.Attributes);
          Assert.Equal(expected.Attributes, (await client.GetCredentialById(tenantId, expected.Id)).Attributes);
        }
        var db = scope.ServiceProvider.GetRequiredService<ProviderDbContext>();
        var records = await db.IssuanceMapping.Where(item => item.TenantIdHolder == tenantId).ToListAsync(TestContext.Current.CancellationToken);
        Assert.Equal(2, records.Count);
        foreach (var record in records)
        {
          Assert.True(record.DeliveryCompleted);
          Assert.False(string.IsNullOrWhiteSpace(record.IssuerCredentialId));
          Assert.False(string.IsNullOrWhiteSpace(record.WalletCredentialId));
          Assert.NotEqual(record.IssuerCredentialId, record.WalletCredentialId);
          walletIds.Add(record.WalletCredentialId!);
        }
        Assert.Null(await client.GetCredentialByClientReferentOrNull(tenantId, ArtifactType.SDJWT, new("_Referent_Client", "pending-platform-solution")));
        // Exercise background reference lookup, then delete/reissue through the same provider contract.
        var recovered = await client.GetCredentialByClientReferentOrNull(tenantId, ArtifactType.SDJWT,
          new("_Referent_Client", issued[0].Attributes["_Referent_Client"]));
        Assert.Equal(issued[0].Id, recovered!.Id);
        await client.DeleteCredential(tenantId, ArtifactType.SDJWT, issued[0].Id);
        Assert.Null(await client.GetCredentialByIdOrNull(tenantId, ArtifactType.SDJWT, issued[0].Id));
        var replacement = await client.IssueCredential(new CredentialIssuanceRequest
        {
          SchemaId = issued[0].SchemaId,
          SchemaName = "YoID|DidxMeLocalDryRun",
          SchemaType = "YoID",
          ArtifactType = ArtifactType.SDJWT,
          TenantIdHolder = tenantId,
          TenantIdIssuer = issuerTenantId,
          ClientReferent = new("_Referent_Client", issued[0].Attributes["_Referent_Client"]),
          Attributes = new Dictionary<string, string>(issued[0].Attributes)
        });
        Assert.NotEqual(issued[0].Id, replacement.Id);
        Assert.Equal(issued[0].Attributes, replacement.Attributes);
        walletIds.Add(replacement.Id);
        Assert.DoesNotContain("_Yoma_Credential_ID",
          (await scope.ServiceProvider.GetRequiredService<IWalletClient>()
            .GetCredential(holderContext, replacement.Id, TestContext.Current.CancellationToken)).Claims.Properties().Select(item => item.Name));
      }
      finally
      {
        // Synthetic fixture cleanup uses the currently authenticated participant; this is not a
        // solution to unattended Replay. Always remove the Yoma login identity, even on failure.
        try
        {
          if (holderContext != null)
          {
            var walletClient = scope.ServiceProvider.GetRequiredService<IWalletClient>();
            var page = await walletClient.ListCredentialPage(holderContext, cancellationToken: CancellationToken.None);
            foreach (var credential in page.Data!) walletIds.Add(credential.Id);
            var header = await scope.ServiceProvider.GetRequiredService<IHolderAuthService>().GetAuthHeader(holderContext, CancellationToken.None);
            foreach (var id in walletIds)
            {
              await options.WalletBaseUri.AppendPathSegments("v2", "credentials", id)
                .WithHeader(header.Key, header.Value).AllowHttpStatus(404).DeleteAsync(cancellationToken: CancellationToken.None);
            }
          }
        }
        finally
        {
          // Local admin tokens are short-lived; cleanup can run after the inline wait expires.
          yomaAdmin = await Token(identityOptions.AuthServerUrl, "master", new
          {
            grant_type = "password",
            client_id = "admin-cli",
            username = "admin",
            password = "password"
          });
          if (subject == null)
          {
            var identities = await Request(adminBase.AppendPathSegment("users"), yomaAdmin)
              .SetQueryParams(new { username, exact = true }).GetJsonAsync<JArray>(cancellationToken: CancellationToken.None);
            subject = identities.SingleOrDefault()?.Value<string>("id");
          }
          if (subject != null) await Request(adminBase.AppendPathSegments("users", subject), yomaAdmin).DeleteAsync(cancellationToken: CancellationToken.None);
          accessor.HttpContext = null;
        }
      }
    }
    #endregion

    #region Private Members
    private static IFlurlRequest Request(string url, string token) => url
      .WithOAuthBearerToken(token)
      .WithTimeout(TimeSpan.FromSeconds(60))
      .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer());

    private static async Task<string> Token(string baseUri, string realm, object form)
    {
      var response = await baseUri.AppendPathSegments("realms", realm, "protocol", "openid-connect", "token")
        .WithSettings(settings => settings.JsonSerializer = new NewtonsoftJsonSerializer())
        .PostUrlEncodedAsync(form).ReceiveJson<JObject>();
      return response.Value<string>("access_token") ?? throw new InvalidOperationException("Local token acquisition failed");
    }
    #endregion
  }
}
