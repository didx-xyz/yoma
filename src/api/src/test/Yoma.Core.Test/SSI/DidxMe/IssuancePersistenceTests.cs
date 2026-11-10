using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Options;
using Npgsql;
using Xunit;
using Yoma.Core.Infrastructure.DidxMe;
using Yoma.Core.Infrastructure.DidxMe.Context;
using Yoma.Core.Infrastructure.DidxMe.Models;
using Yoma.Core.Infrastructure.DidxMe.Repositories;
using Yoma.Core.Infrastructure.DidxMe.Services;

namespace Yoma.Core.Test.SSI.DidxMe
{
  public class IssuancePersistenceTests
  {
    #region Tests
    [Fact(Explicit = true)]
    public async Task ExistingRowsMigrateAndRetriesReuseAnActiveAttempt()
    {
      var connection = Environment.GetEnvironmentVariable("YOMA_DIDXME_TEST_POSTGRES");
      if (string.IsNullOrWhiteSpace(connection))
        throw new InvalidOperationException("Supply a disposable local PostgreSQL connection through YOMA_DIDXME_TEST_POSTGRES");

      var settings = new NpgsqlConnectionStringBuilder(connection);
      if (settings.Host != "127.0.0.1" && settings.Host != "localhost")
        throw new InvalidOperationException("This test permits only local PostgreSQL");

      // Always create a new database; never migrate or delete the database supplied by the caller.
      settings.Database = $"yoma_tracking_test_{Guid.NewGuid():N}";
      var options = new DbContextOptionsBuilder<ProviderDbContext>()
        .UseNpgsql(settings.ConnectionString, provider => provider.EnableRetryOnFailure()).Options;
      await using var context = new ProviderDbContext(options);
      try
      {
        await context.GetService<IMigrator>().MigrateAsync("20261102080143_ProviderDb_PresetAndIssuanceMappings", TestContext.Current.CancellationToken);
        await context.Database.ExecuteSqlRawAsync("""
          INSERT INTO "DidxMe"."CredentialPresetMapping"
            ("Id", "TenantAlias", "Name", "Version", "ArtifactType", "AttributeNames", "PresetId", "Vct", "DateCreated")
          VALUES ('preset-test', 'yoma', 'YoID|Default', '1.0', 'SDJWT', '[]', 'preset-test', 'https://example.test/type', now());
          INSERT INTO "DidxMe"."IssuanceMapping"
            ("Id", "TenantAlias", "PresetMappingId", "TenantIdIssuer", "TenantIdHolder", "ClientReferentKey", "ClientReferentValue",
             "IssuanceId", "IssuerCredentialId", "WalletCredentialId", "DeliveryCompleted", "DateCreated", "DateModified")
          VALUES ('00000000-0000-4000-8000-000000000001', 'yoma', 'preset-test', 'issuer-test', 'holder-test', '_Referent_Client', 'legacy',
            'session-test', 'issuer-credential-test', NULL, true, now(), now());
          """, TestContext.Current.CancellationToken);

        await context.Database.MigrateAsync(TestContext.Current.CancellationToken);
        var legacy = await context.IssuanceMapping.SingleAsync(TestContext.Current.CancellationToken);
        Assert.Equal(IssuanceStatus.Accepted.ToString(), legacy.Status);
        Assert.Equal("session-test", legacy.IssuanceId);
        Assert.Null(legacy.WalletCredentialId);

        async Task<IssuanceMapping> Create()
        {
          await using var attempt = new ProviderDbContext(options);
          var service = new IssuanceTrackingService(Options.Create(new ProviderOptions { TenantAlias = "yoma" }),
            new IssuanceMappingRepository(attempt), new ExecutionStrategyService(attempt));
          return await service.Create(new IssuanceMapping
          {
            TenantAlias = "yoma",
            PresetMappingId = "preset-test",
            TenantIdIssuer = "issuer-test",
            TenantIdHolder = "holder-test",
            ClientReferentKey = "_Referent_Client",
            ClientReferentValue = "new-attempt",
            Status = IssuanceStatus.Prepared.ToString()
          });
        }

        await Create();
        var created = await context.IssuanceMapping.SingleAsync(item => item.ClientReferentValue == "new-attempt", TestContext.Current.CancellationToken);
        Assert.Equal(IssuanceStatus.Prepared.ToString(), created.Status);
        Assert.Equal(created.Id, (await Create()).Id);

        created.Status = IssuanceStatus.Deleted.ToString();
        await context.SaveChangesAsync(TestContext.Current.CancellationToken);
        var replacement = await Create();
        Assert.NotEqual(created.Id, replacement.Id);
        Assert.Equal(1, await context.IssuanceMapping.CountAsync(item => item.ClientReferentValue == "new-attempt" &&
          item.Status != nameof(IssuanceStatus.Deleted), TestContext.Current.CancellationToken));
      }
      finally
      {
        await context.Database.EnsureDeletedAsync(CancellationToken.None);
      }
    }
    #endregion

  }
}
