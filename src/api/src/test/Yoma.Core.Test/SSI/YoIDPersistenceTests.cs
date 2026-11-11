using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Options;
using Moq;
using Npgsql;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Services;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.SSI.Repositories;
using Yoma.Core.Infrastructure.Shared.Interceptors;

namespace Yoma.Core.Test.SSI
{
  public class YoIDPersistenceTests
  {
    #region Tests
    [Fact(Explicit = true)]
    public async Task MigrationPreservesIssuedRowsAndQueriesSupportOneReplacementChain()
    {
      var connection = System.Environment.GetEnvironmentVariable("YOMA_YOID_TEST_POSTGRES");
      if (string.IsNullOrWhiteSpace(connection)) throw new InvalidOperationException("Supply a disposable local PostgreSQL connection");
      var settings = new NpgsqlConnectionStringBuilder(connection);
      if (settings.Host is not ("127.0.0.1" or "localhost")) throw new InvalidOperationException("Local databases only");
      settings.Database = "yoma_yoid_test_" + Guid.NewGuid().ToString("N");
      var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(settings.ConnectionString, value => value.UseNetTopologySuite())
        .AddInterceptors(new ForUpdateInterceptor()).Options;
      await using var context = new ApplicationDbContext(options);
      try
      {
        Assert.False(context.Database.HasPendingModelChanges());
        await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        // Reconstruct the previous table shape, then apply this migration to a real issued row.
        await context.Database.ExecuteSqlRawAsync("""
          ALTER TABLE "SSI"."CredentialIssuance" DROP CONSTRAINT "FK_CredentialIssuance_CredentialIssuance_ParentId";
          DROP INDEX "SSI"."IX_CredentialIssuance_ParentId";
          DROP INDEX "SSI"."IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~";
          ALTER TABLE "SSI"."CredentialIssuance" DROP COLUMN "ParentId", DROP COLUMN "DateRevoked", DROP COLUMN "DateDeleted", DROP COLUMN "DateRefreshRequested";
          CREATE UNIQUE INDEX "IX_CredentialIssuance_SchemaTypeId_UserId_OrganizationId_MyOpp~"
            ON "SSI"."CredentialIssuance" ("SchemaTypeId", "UserId", "OrganizationId", "MyOpportunityId") NULLS NOT DISTINCT;
          CREATE TABLE public."__EFMigrationsHistory" ("MigrationId" varchar(150) PRIMARY KEY, "ProductVersion" varchar(32) NOT NULL);
          INSERT INTO "SSI"."SchemaType" ("Id", "Name", "Description", "SupportMultiple", "DateCreated")
            VALUES ('00000000-0000-4000-8000-000000000001', 'YoID', 'Test', false, now());
          INSERT INTO "SSI"."CredentialIssuanceStatus" ("Id", "Name", "DateCreated") VALUES
            ('00000000-0000-4000-8000-000000000002', 'Issued', now()),
            ('00000000-0000-4000-8000-000000000003', 'Pending', now()),
            ('00000000-0000-4000-8000-000000000006', 'Error', now());
          INSERT INTO "Entity"."User" ("Id", "DateCreated", "DateModified") VALUES ('00000000-0000-4000-8000-000000000004', now(), now());
          INSERT INTO "SSI"."CredentialIssuance" ("Id", "SchemaTypeId", "UserId", "StatusId", "SchemaName", "SchemaVersion", "ArtifactType", "CredentialId", "DateIssued", "DateCreated", "DateModified")
            VALUES ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004',
              '00000000-0000-4000-8000-000000000002', 'YoID|Default', '1.0', 'SDJWT', 'original-wallet', '2026-01-01T00:00:00Z', now(), now());
          """, TestContext.Current.CancellationToken);
        var migrations = context.GetService<IMigrationsAssembly>().Migrations.Keys.ToList();
        var target = migrations.Single(value => value.EndsWith("_ApplicationDb_SSI_YoID_Replacement", StringComparison.Ordinal));
        var previous = migrations[migrations.IndexOf(target) - 1];
        var script = context.GetService<IMigrator>().GenerateScript(previous, target);
        await context.Database.ExecuteSqlRawAsync(script, TestContext.Current.CancellationToken);
        var repository = new SSICredentialIssuanceRepository(context);
        var original = repository.Query().Single();
        Assert.Equal("original-wallet", original.CredentialId);
        Assert.Equal("1.0", original.SchemaVersion);
        Assert.Null(original.ParentId);
        Assert.Null(original.DateRevoked);
        Assert.Null(original.DateRefreshRequested);

        var statuses = new Mock<ISSICredentialIssuanceStatusService>();
        statuses.Setup(value => value.GetByName(It.IsAny<string>())).Returns((string name) => context.SSICredentialIssuanceStatus
          .Where(value => value.Name == name).Select(value => new SSICredentialIssuanceStatus { Id = value.Id }).Single());
        var types = new Mock<ISSISchemaTypeService>();
        types.Setup(value => value.GetByName(It.IsAny<string>())).Returns((string name) => new SSISchemaType { Id = name == nameof(SchemaType.YoID) ? original.SchemaTypeId : Guid.Empty });
        var tenantStatuses = new Mock<ISSITenantCreationStatusService>();
        tenantStatuses.Setup(value => value.GetByName(It.IsAny<string>())).Returns(new SSITenantCreationStatus { Id = Guid.Empty });
        var participations = new Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>>();
        participations.Setup(value => value.Query()).Returns(context.MyOpportunity.Select(value => new Domain.MyOpportunity.Models.MyOpportunity
          { Id = value.Id, UserId = value.UserId, OrganizationId = value.Opportunity.OrganizationId }));
        var tenants = new Mock<IRepository<SSITenantCreation>>();
        tenants.Setup(value => value.Query()).Returns(context.SSITenantCreation.Select(value => new SSITenantCreation
          { Id = value.Id, StatusId = value.StatusId, EntityType = value.EntityType, UserId = value.UserId, OrganizationId = value.OrganizationId, TenantId = value.TenantId }));
        var service = new SSICredentialService(Options.Create(new AppSettings { SSISchemaFullNameYoID = "YoID|Default" }),
          Mock.Of<ISSISchemaService>(), statuses.Object, repository, types.Object, tenantStatuses.Object, tenants.Object,
          participations.Object, new Infrastructure.Database.Core.Services.ExecutionStrategyService(context));
        await service.ScheduleReissuance(original.UserId!.Value);
        var queued = Assert.Single(service.ListPendingReissuanceSchedule(10, []));
        Assert.Equal(CredentialIssuanceStatus.Reissue, queued.Status);
        await service.ProcessReissuance(queued, true);
        await service.ProcessReissuance(queued, true);
        Assert.Equal(2, repository.Query().Count());
        var child = repository.Query().Single(value => value.ParentId == original.Id);
        Assert.Null(child.DateIssued);
        Assert.Empty(service.ListPendingIssuanceSchedule(10, []));
        var revoke = Assert.Single(service.ListPendingReissuanceSchedule(10, []));
        revoke.DateRevoked = DateTimeOffset.UtcNow;
        revoke.Status = CredentialIssuanceStatus.Revoked;
        await service.UpdateScheduleIssuance(revoke);
        Assert.Equal(child.Id, Assert.Single(service.ListPendingIssuanceSchedule(10, [])).Id);
        Assert.Empty(service.ListPendingReissuanceSchedule(10, []));
        await service.ScheduleReissuance(original.UserId.Value);
        Assert.NotNull(repository.Query().Single(value => value.Id == child.Id).DateRefreshRequested);

        await using var duplicateContext = new ApplicationDbContext(options);
        var duplicateRepository = new SSICredentialIssuanceRepository(duplicateContext);
        child.Id = Guid.NewGuid();
        await Assert.ThrowsAsync<DbUpdateException>(() => duplicateRepository.Create(child));
      }
      finally
      {
        await context.Database.EnsureDeletedAsync(CancellationToken.None);
      }
    }
    #endregion
  }
}
