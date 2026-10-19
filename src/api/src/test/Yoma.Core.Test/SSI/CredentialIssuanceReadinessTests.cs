using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Moq;
using Npgsql;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Domain.SSI.Services;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories;
using Yoma.Core.Infrastructure.Database.SSI.Repositories;

namespace Yoma.Core.Test.SSI
{
  public class CredentialIssuanceReadinessTests
  {
    #region Tests
    [Fact]
    public void TenantReadyItemsAreSelectedBeforePagingPastAnOlderBlockedBacklog()
    {
      var fixture = new Fixture();
      for (var index = 0; index < 40; index++) fixture.AddOpportunity(false);
      var ready = Enumerable.Range(0, 23).Select(_ => fixture.AddOpportunity(true)).ToList();

      var first = fixture.Service.ListPendingIssuanceSchedule(10, []);
      var second = fixture.Service.ListPendingIssuanceSchedule(10, [.. first.Select(item => item.Id)]);
      var last = fixture.Service.ListPendingIssuanceSchedule(10, [.. first.Concat(second).Select(item => item.Id)]);

      Assert.Equal(10, first.Count);
      Assert.Equal(10, second.Count);
      Assert.Equal(3, last.Count);
      Assert.Equal(ready.Select(item => item.Id), first.Concat(second).Concat(last).Select(item => item.Id));
      Assert.All(fixture.Items, item =>
      {
        Assert.Equal(CredentialIssuanceStatus.Pending, item.Status);
        Assert.Null(item.RetryCount);
        Assert.Null(item.ErrorReason);
      });
      fixture.Repository.Verify(repository => repository.Update(It.IsAny<SSICredentialIssuance>()), Times.Never);
    }

    [Theory]
    [InlineData("missing-holder")]
    [InlineData("missing-issuer")]
    [InlineData("holder-pending")]
    [InlineData("issuer-error")]
    [InlineData("holder-empty")]
    [InlineData("issuer-null")]
    [InlineData("wrong-holder")]
    [InlineData("wrong-issuer")]
    [InlineData("wrong-entity-type")]
    [InlineData("missing-participation")]
    public void BothMatchingCreatedTenantsWithIdsAreRequired(string blockedReason)
    {
      var fixture = new Fixture();
      fixture.AddOpportunity(true);
      var holder = fixture.Tenants[0];
      var issuer = fixture.Tenants[1];
      switch (blockedReason)
      {
        case "missing-holder": fixture.Tenants.Remove(holder); break;
        case "missing-issuer": fixture.Tenants.Remove(issuer); break;
        case "holder-pending": holder.StatusId = Guid.NewGuid(); holder.Status = TenantCreationStatus.Pending; break;
        case "issuer-error": issuer.StatusId = Guid.NewGuid(); issuer.Status = TenantCreationStatus.Error; break;
        case "holder-empty": holder.TenantId = string.Empty; break;
        case "issuer-null": issuer.TenantId = null; break;
        case "wrong-holder": holder.UserId = Guid.NewGuid(); break;
        case "wrong-issuer": issuer.OrganizationId = Guid.NewGuid(); break;
        case "wrong-entity-type": holder.EntityType = EntityType.Organization.ToString(); break;
        case "missing-participation": fixture.Participations.Clear(); break;
        default: throw new NotSupportedException($"Blocked reason '{blockedReason}' is not supported");
      }

      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(10, []));
    }

    [Fact]
    public void ReadyTenantsAreCaseInsensitiveAndBlockedItemsBecomeEligibleWithoutRequeueing()
    {
      var fixture = new Fixture();
      var item = fixture.AddOpportunity(false);
      var modified = item.DateModified;
      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(10, []));
      fixture.AddTenants(fixture.Participations.Single());
      fixture.Tenants[0].EntityType = "uSeR";
      fixture.Tenants[1].EntityType = "oRgAnIzAtIoN";

      Assert.Same(item, Assert.Single(fixture.Service.ListPendingIssuanceSchedule(10, [])));
      Assert.Equal(modified, item.DateModified);
      Assert.Null(item.RetryCount);
    }

    [Fact]
    public void ScheduledChoicesSurviveLaterOpportunityChangesAndYoIdKeepsItsExistingPath()
    {
      var fixture = new Fixture();
      var opportunity = fixture.AddOpportunity(true);
      opportunity.SchemaName = "Opportunity|Custom";
      var participation = fixture.Participations.Single();
      participation.OpportunityCredentialIssuanceEnabled = false;
      participation.OpportunitySSISchemaName = null;
      participation.OpportunityStatus = Domain.Opportunity.Status.Deleted;
      fixture.Items.Add(new SSICredentialIssuance
      {
        Id = Guid.NewGuid(),
        SchemaTypeId = Guid.NewGuid(),
        SchemaType = SchemaType.YoID,
        StatusId = fixture.PendingId,
        UserId = Guid.NewGuid(),
        SchemaName = "YoID|Default",
        ArtifactType = ArtifactType.ACR,
        DateModified = opportunity.DateModified.AddMinutes(1)
      });

      var results = fixture.Service.ListPendingIssuanceSchedule(10, []);

      Assert.Equal(2, results.Count);
      Assert.Same(opportunity, results[0]);
      Assert.Equal("Opportunity|Custom", results[0].SchemaName);
      Assert.Equal(SchemaType.YoID, results[1].SchemaType);
    }

    [Fact]
    public void PendingStatusSkipListAndDeterministicOrderingArePreserved()
    {
      var fixture = new Fixture();
      var first = fixture.AddOpportunity(true);
      var second = fixture.AddOpportunity(true);
      second.DateModified = first.DateModified;
      var error = fixture.AddOpportunity(true);
      error.StatusId = Guid.NewGuid();
      error.Status = CredentialIssuanceStatus.Error;
      var expected = new[] { first, second }.OrderBy(item => item.Id).ToList();

      Assert.Equal(expected, fixture.Service.ListPendingIssuanceSchedule(10, []));
      Assert.Same(expected[1], Assert.Single(fixture.Service.ListPendingIssuanceSchedule(1, [expected[0].Id])));
    }

    [Fact]
    public async Task PostgreSqlExecutesTheActualRepositoryReadinessQuery()
    {
      var value = System.Environment.GetEnvironmentVariable("YOMA_SSI_READINESS_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(value),
        "Set YOMA_SSI_READINESS_TEST_CONNECTION to an isolated local yoma_ssi_readiness_* database.");
      var builder = new NpgsqlConnectionStringBuilder(value);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_ssi_readiness_", builder.Database);
      await using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.UseNetTopologySuite()).Options);
      await context.Database.OpenConnectionAsync(TestContext.Current.CancellationToken);
      await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
      var fixture = new Fixture();
      var blocked = fixture.AddOpportunity(false);
      var ready = fixture.AddOpportunity(true);

      // A minimal isolated database is enough to execute the real projected repositories.
      // The transaction rolls back all tables/data; no application database is contacted.
      await context.Database.ExecuteSqlRawAsync("""
        CREATE SCHEMA "SSI";
        CREATE SCHEMA "Opportunity";
        CREATE TABLE "SSI"."SchemaType" ("Id" uuid PRIMARY KEY, "Name" text NOT NULL);
        CREATE TABLE "SSI"."CredentialIssuanceStatus" ("Id" uuid PRIMARY KEY, "Name" text NOT NULL);
        CREATE TABLE "SSI"."CredentialIssuance" (
          "Id" uuid PRIMARY KEY, "SchemaTypeId" uuid, "StatusId" uuid, "ArtifactType" text,
          "SchemaName" text, "SchemaVersion" text, "UserId" uuid, "OrganizationId" uuid,
          "MyOpportunityId" uuid, "CredentialId" text, "ErrorReason" text, "RetryCount" smallint,
          "DateCreated" timestamptz, "DateModified" timestamptz);
        CREATE TABLE "SSI"."TenantCreation" (
          "Id" uuid PRIMARY KEY, "EntityType" text, "StatusId" uuid,
          "UserId" uuid, "OrganizationId" uuid, "TenantId" text);
        CREATE TABLE "Opportunity"."MyOpportunity" ("Id" uuid PRIMARY KEY, "UserId" uuid, "OpportunityId" uuid);
        CREATE TABLE "Opportunity"."Opportunity" ("Id" uuid PRIMARY KEY, "OrganizationId" uuid);
        """, TestContext.Current.CancellationToken);
      await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "SSI"."SchemaType" VALUES ({fixture.OpportunityTypeId}, 'Opportunity');
        INSERT INTO "SSI"."CredentialIssuanceStatus" VALUES ({fixture.PendingId}, 'Pending');
        """, TestContext.Current.CancellationToken);
      foreach (var item in fixture.Items)
        await context.Database.ExecuteSqlInterpolatedAsync($"""
          INSERT INTO "SSI"."CredentialIssuance"
            ("Id", "SchemaTypeId", "StatusId", "ArtifactType", "SchemaName", "MyOpportunityId", "DateCreated", "DateModified")
          VALUES ({item.Id}, {item.SchemaTypeId}, {item.StatusId}, 'JWS', {item.SchemaName},
            {item.MyOpportunityId}, {item.DateCreated}, {item.DateModified});
          """, TestContext.Current.CancellationToken);
      foreach (var participation in fixture.Participations)
        await context.Database.ExecuteSqlInterpolatedAsync($"""
          INSERT INTO "Opportunity"."Opportunity" VALUES ({participation.OpportunityId}, {participation.OrganizationId});
          INSERT INTO "Opportunity"."MyOpportunity" VALUES ({participation.Id}, {participation.UserId}, {participation.OpportunityId});
          """, TestContext.Current.CancellationToken);
      foreach (var tenant in fixture.Tenants)
        await context.Database.ExecuteSqlInterpolatedAsync($"""
          INSERT INTO "SSI"."TenantCreation" VALUES
            ({tenant.Id}, {tenant.EntityType}, {tenant.StatusId}, {tenant.UserId}, {tenant.OrganizationId}, {tenant.TenantId});
          """, TestContext.Current.CancellationToken);

      fixture.Repository.Setup(repository => repository.Query()).Returns(new SSICredentialIssuanceRepository(context).Query());
      fixture.TenantRepository.Setup(repository => repository.Query()).Returns(new SSITenantCreationRepository(context).Query());
      fixture.ParticipationRepository.Setup(repository => repository.Query()).Returns(new MyOpportunityRepository(context).Query());

      var result = Assert.Single(fixture.Service.ListPendingIssuanceSchedule(1, []));
      Assert.Equal(ready.Id, result.Id);
      Assert.NotEqual(blocked.Id, result.Id);
      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(1, [ready.Id]));

      // Match the Stage replay shape: 3,991 old blocked records and 223 ready records.
      // This also verifies that eligibility stays in SQL ahead of LIMIT, not after paging.
      var readyParticipation = fixture.Participations.Single(item => item.Id == ready.MyOpportunityId);
      await context.Database.ExecuteSqlInterpolatedAsync($"""
        CREATE TEMP TABLE "ReadinessCandidates" ON COMMIT DROP AS
        SELECT gen_random_uuid() AS "QueueId", gen_random_uuid() AS "MyOpportunityId",
          gen_random_uuid() AS "OpportunityId",
          CASE WHEN i <= 3990 THEN gen_random_uuid() ELSE {readyParticipation.UserId} END AS "UserId",
          i <= 3990 AS "Blocked"
        FROM generate_series(1, 4212) AS i;
        INSERT INTO "Opportunity"."Opportunity"
          SELECT "OpportunityId", {readyParticipation.OrganizationId} FROM "ReadinessCandidates";
        INSERT INTO "Opportunity"."MyOpportunity"
          SELECT "MyOpportunityId", "UserId", "OpportunityId" FROM "ReadinessCandidates";
        INSERT INTO "SSI"."CredentialIssuance"
          ("Id", "SchemaTypeId", "StatusId", "ArtifactType", "SchemaName", "MyOpportunityId", "DateCreated", "DateModified")
          SELECT "QueueId", {fixture.OpportunityTypeId}, {fixture.PendingId}, 'JWS', 'Opportunity|Default',
            "MyOpportunityId", {ready.DateCreated},
            CASE WHEN "Blocked" THEN {blocked.DateModified.AddDays(-1)} ELSE {ready.DateModified.AddMinutes(1)} END
          FROM "ReadinessCandidates";
        """, TestContext.Current.CancellationToken);
      var batch = fixture.Service.ListPendingIssuanceSchedule(1000, []);
      Assert.Equal(223, batch.Count);
      Assert.Equal(ready.Id, batch[0].Id);
      Assert.Empty(fixture.Service.ListPendingIssuanceSchedule(1000, [.. batch.Select(item => item.Id)]));
      await transaction.RollbackAsync(TestContext.Current.CancellationToken);
    }
    #endregion Tests

    #region Fixture
    private sealed class Fixture
    {
      public Guid PendingId { get; } = Guid.NewGuid();
      public Guid OpportunityTypeId { get; } = Guid.NewGuid();
      private readonly Guid _tenantCreatedId = Guid.NewGuid();
      public List<SSICredentialIssuance> Items { get; } = [];
      public List<SSITenantCreation> Tenants { get; } = [];
      public List<Domain.MyOpportunity.Models.MyOpportunity> Participations { get; } = [];
      public Mock<IRepository<SSICredentialIssuance>> Repository { get; } = new();
      public Mock<IRepository<SSITenantCreation>> TenantRepository { get; } = new();
      public Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Domain.MyOpportunity.Models.MyOpportunity>> ParticipationRepository { get; } = new();
      public SSICredentialService Service { get; }

      public Fixture()
      {
        var statuses = new Mock<ISSICredentialIssuanceStatusService>();
        statuses.Setup(service => service.GetByName(CredentialIssuanceStatus.Pending.ToString()))
          .Returns(new SSICredentialIssuanceStatus { Id = PendingId });
        var types = new Mock<ISSISchemaTypeService>();
        types.Setup(service => service.GetByName(SchemaType.Opportunity.ToString()))
          .Returns(new SSISchemaType { Id = OpportunityTypeId });
        var tenantStatuses = new Mock<ISSITenantCreationStatusService>();
        tenantStatuses.Setup(service => service.GetByName(TenantCreationStatus.Created.ToString()))
          .Returns(new SSITenantCreationStatus { Id = _tenantCreatedId });
        Repository.Setup(repository => repository.Query()).Returns(() => Items.AsQueryable());
        TenantRepository.Setup(repository => repository.Query()).Returns(() => Tenants.AsQueryable());
        ParticipationRepository.Setup(repository => repository.Query()).Returns(() => Participations.AsQueryable());
        Service = new SSICredentialService(Options.Create(new AppSettings()), Mock.Of<ISSISchemaService>(),
          statuses.Object, Repository.Object, types.Object, tenantStatuses.Object,
          TenantRepository.Object, ParticipationRepository.Object);
      }

      public SSICredentialIssuance AddOpportunity(bool ready)
      {
        var participation = new Domain.MyOpportunity.Models.MyOpportunity
        {
          Id = Guid.NewGuid(),
          OpportunityId = Guid.NewGuid(),
          UserId = Guid.NewGuid(),
          OrganizationId = Guid.NewGuid()
        };
        Participations.Add(participation);
        var item = new SSICredentialIssuance
        {
          Id = Guid.NewGuid(),
          SchemaTypeId = OpportunityTypeId,
          SchemaType = SchemaType.Opportunity,
          StatusId = PendingId,
          Status = CredentialIssuanceStatus.Pending,
          MyOpportunityId = participation.Id,
          SchemaName = "Opportunity|Default",
          ArtifactType = ArtifactType.JWS,
          DateCreated = DateTimeOffset.UtcNow,
          DateModified = DateTimeOffset.UtcNow
        };
        Items.Add(item);
        if (ready) AddTenants(participation);
        return item;
      }

      public void AddTenants(Domain.MyOpportunity.Models.MyOpportunity participation)
      {
        Tenants.Add(new SSITenantCreation
        {
          Id = Guid.NewGuid(),
          EntityType = EntityType.User.ToString(),
          UserId = participation.UserId,
          StatusId = _tenantCreatedId,
          Status = TenantCreationStatus.Created,
          TenantId = "holder"
        });
        Tenants.Add(new SSITenantCreation
        {
          Id = Guid.NewGuid(),
          EntityType = EntityType.Organization.ToString(),
          OrganizationId = participation.OrganizationId,
          StatusId = _tenantCreatedId,
          Status = TenantCreationStatus.Created,
          TenantId = "issuer"
        });
      }
    }
    #endregion Fixture
  }
}
