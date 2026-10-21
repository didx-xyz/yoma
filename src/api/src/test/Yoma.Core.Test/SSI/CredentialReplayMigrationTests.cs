using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Npgsql;
using Xunit;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Infrastructure.AriesCloud.Context;
using Yoma.Core.Infrastructure.AriesCloud.Repositories;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Migrations;
using Yoma.Core.Infrastructure.Database.SSI.Repositories;

namespace Yoma.Core.Test.SSI
{
  public class CredentialReplayMigrationTests
  {
    #region Tests
    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task ExistingExecutionStrategyTrackingOptInPreservesDefault(bool clearTrackedChanges, bool fail)
    {
      await using var context = CreateContext("Host=localhost;Database=yoma_ssi_replay_model;Username=unused;Password=unused");
      var strategy = new Infrastructure.Database.Core.Services.ExecutionStrategyService(context);
      context.Attach(new Infrastructure.Database.SSI.Entities.SSICredentialIssuance { Id = Guid.NewGuid() });

      Task Execute() => clearTrackedChanges
        ? strategy.ExecuteInExecutionStrategyAsync(Body, true)
        : strategy.ExecuteInExecutionStrategyAsync(Body);
      Task Body() => fail ? throw new InvalidOperationException("Probe failed") : Task.CompletedTask;

      if (fail) await Assert.ThrowsAsync<InvalidOperationException>(Execute);
      else await Execute();

      Assert.Equal(clearTrackedChanges ? 0 : 1, context.ChangeTracker.Entries().Count());
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task AmbientTransactionDoesNotRetryAndHonorsTrackingOptIn(bool clearTrackedChanges)
    {
      await using var context = CreateContext("Host=localhost;Database=yoma_ssi_replay_model;Username=unused;Password=unused");
      var strategy = new Infrastructure.Database.Core.Services.ExecutionStrategyService(context);
      context.Attach(new Infrastructure.Database.SSI.Entities.SSICredentialIssuance { Id = Guid.NewGuid() });
      var attempts = 0;
      using var transaction = TransactionScopeHelper.CreateReadCommitted();

      await Assert.ThrowsAsync<PostgresException>(() => strategy.ExecuteInExecutionStrategyAsync(() =>
      {
        attempts++;
        throw new PostgresException("Outer transaction owns the retry", "ERROR", "ERROR", "40001");
      }, clearTrackedChanges));

      Assert.Equal(1, attempts);
      Assert.Equal(clearTrackedChanges ? 0 : 1, context.ChangeTracker.Entries().Count());
    }

    [Fact]
    public async Task ExecutionStrategyClearsAcceptedStateBeforeRetryingARolledBackScheduleUpdate()
    {
      var connection = GetIsolatedConnection();
      await using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(connection, options => options.UseNetTopologySuite().EnableRetryOnFailure()).Options);
      try
      {
        await context.Database.ExecuteSqlRawAsync("""
          CREATE SCHEMA "SSI";
          CREATE TABLE "SSI"."CredentialIssuance" (
            "Id" uuid PRIMARY KEY, "SchemaTypeId" uuid, "StatusId" uuid, "ArtifactType" text,
            "SchemaName" text, "SchemaVersion" text, "UserId" uuid, "OrganizationId" uuid,
            "MyOpportunityId" uuid, "CredentialId" text, "DateIssued" timestamptz, "ErrorReason" text,
            "RetryCount" smallint, "DateCreated" timestamptz, "DateModified" timestamptz);
          """, TestContext.Current.CancellationToken);
        var scheduleRepository = new SSICredentialIssuanceRepository(context);
        var replayId = Guid.NewGuid();
        var pendingId = Guid.NewGuid();
        var date = new DateTimeOffset(2025, 7, 15, 12, 0, 0, TimeSpan.Zero);
        var item = await scheduleRepository.Create(new Domain.SSI.Models.SSICredentialIssuance
        {
          Id = Guid.NewGuid(),
          SchemaTypeId = Guid.NewGuid(),
          StatusId = replayId,
          ArtifactType = ArtifactType.JWS,
          SchemaName = "Opportunity|Default",
          SchemaVersion = "1.0",
          CredentialId = "old-id",
          DateIssued = date
        });
        var strategy = new Infrastructure.Database.Core.Services.ExecutionStrategyService(context);
        var attempts = 0;

        await strategy.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var transaction = TransactionScopeHelper.CreateReadCommitted();
          // The opted-in helper must discard accepted values before a transient retry.
          Assert.Equal(replayId, context.SSICredentialIssuance.AsNoTracking().Single(row => row.Id == item.Id).StatusId);
          item.StatusId = pendingId;
          item.CredentialId = null;
          item.SchemaVersion = null;
          await scheduleRepository.Update(item);
          attempts++;
          if (attempts == 1) throw new PostgresException("Retry this item", "ERROR", "ERROR", "40001");
          transaction.Complete();
        }, true);

        Assert.Equal(2, attempts);
        var saved = context.SSICredentialIssuance.AsNoTracking().Single(row => row.Id == item.Id);
        Assert.Equal(pendingId, saved.StatusId);
        Assert.Null(saved.CredentialId);
        Assert.Null(saved.SchemaVersion);
        Assert.Equal(date, saved.DateIssued);
      }
      finally
      {
        // This schema belongs only to the explicitly guarded disposable replay test database.
        await using var cleanup = new NpgsqlConnection(connection);
        await cleanup.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand("DROP SCHEMA IF EXISTS \"SSI\" CASCADE;", cleanup);
        await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
      }
    }

    [Fact]
    public void CapabilityMigrationAddsTheNullableDateAndReplayLookupWithoutSchedulingReplay()
    {
      var migration = new ApplicationDb_SSI_Credential_Replay();
      var column = Assert.Single(migration.UpOperations.OfType<AddColumnOperation>());
      Assert.Equal("DateIssued", column.Name);
      Assert.Equal("SSI", column.Schema);
      Assert.Equal("CredentialIssuance", column.Table);
      Assert.True(column.IsNullable);
      Assert.Null(column.DefaultValue);
      var lookup = Assert.Single(migration.UpOperations.OfType<InsertDataOperation>());
      Assert.Equal("CredentialIssuanceStatus", lookup.Table);
      Assert.Equal(CredentialIssuanceStatus.Replay.ToString(), lookup.Values[0, 1]);
      var backfill = Assert.Single(migration.UpOperations.OfType<SqlOperation>());
      Assert.False(backfill.SuppressTransaction);
      Assert.Contains("status.\"Name\" = 'Issued'", backfill.Sql);
      Assert.Contains("SET \"DateIssued\" = issuance.\"DateModified\"", backfill.Sql);
      Assert.DoesNotContain("SET \"StatusId\"", backfill.Sql);
      Assert.DoesNotContain("DELETE", backfill.Sql, StringComparison.OrdinalIgnoreCase);
      Assert.Throws<NotSupportedException>(() => migration.DownOperations);
    }

    [Fact]
    public void ModelSnapshotMatchesTheNullableIssuedDateModel()
    {
      using var context = CreateContext("Host=localhost;Database=yoma_ssi_replay_model;Username=unused;Password=unused");
      Assert.False(context.Database.HasPendingModelChanges());
    }

    [Fact]
    public async Task PostgreSqlAppliesTheMigrationAndRoundTripsTheOriginalDate()
    {
      var value = GetIsolatedConnection();
      await using var context = CreateContext(value);
      await context.Database.OpenConnectionAsync(TestContext.Current.CancellationToken);
      await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
      var issuedId = Guid.NewGuid();
      var pendingId = Guid.NewGuid();
      var errorId = Guid.NewGuid();
      var schemaTypeId = Guid.NewGuid();
      var issuedRowId = Guid.NewGuid();
      var pendingRowId = Guid.NewGuid();
      var errorRowId = Guid.NewGuid();
      var original = new DateTimeOffset(2025, 7, 15, 12, 30, 0, TimeSpan.Zero);
      await context.Database.ExecuteSqlRawAsync("""
        CREATE SCHEMA "SSI";
        CREATE TABLE "SSI"."CredentialIssuanceStatus" ("Id" uuid PRIMARY KEY, "Name" text NOT NULL, "DateCreated" timestamptz NOT NULL);
        CREATE TABLE "SSI"."SchemaType" ("Id" uuid PRIMARY KEY, "Name" text NOT NULL);
        CREATE TABLE "SSI"."CredentialIssuance" (
          "Id" uuid PRIMARY KEY, "SchemaTypeId" uuid, "StatusId" uuid, "ArtifactType" text,
          "SchemaName" text, "SchemaVersion" text, "UserId" uuid, "OrganizationId" uuid,
          "MyOpportunityId" uuid, "CredentialId" text, "ErrorReason" text, "RetryCount" smallint,
          "DateCreated" timestamptz, "DateModified" timestamptz);
        """, TestContext.Current.CancellationToken);
      await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "SSI"."SchemaType" VALUES ({schemaTypeId}, 'YoID');
        INSERT INTO "SSI"."CredentialIssuanceStatus" VALUES
          ({issuedId}, 'Issued', {original}), ({pendingId}, 'Pending', {original}), ({errorId}, 'Error', {original});
        INSERT INTO "SSI"."CredentialIssuance"
          ("Id", "SchemaTypeId", "StatusId", "ArtifactType", "SchemaName", "SchemaVersion", "CredentialId", "DateCreated", "DateModified") VALUES
          ({issuedRowId}, {schemaTypeId}, {issuedId}, 'ACR', 'YoID|Default', '1.0', 'old-id', {original.AddDays(-2)}, {original}),
          ({pendingRowId}, {schemaTypeId}, {pendingId}, 'ACR', 'YoID|Default', NULL, NULL, {original}, {original}),
          ({errorRowId}, {schemaTypeId}, {errorId}, 'ACR', 'YoID|Default', NULL, NULL, {original}, {original});
        """, TestContext.Current.CancellationToken);
      var migration = new ApplicationDb_SSI_Credential_Replay();
      var commands = context.GetService<IMigrationsSqlGenerator>().Generate(migration.UpOperations, context.Model);
      foreach (var command in commands)
        await context.Database.ExecuteSqlRawAsync(command.CommandText, TestContext.Current.CancellationToken);

      var repository = new SSICredentialIssuanceRepository(context);
      var rows = repository.Query().ToList();
      Assert.Equal(3, rows.Count);
      var issued = Assert.Single(rows, row => row.Id == issuedRowId);
      Assert.Equal(CredentialIssuanceStatus.Issued, issued.Status);
      Assert.Equal(original, issued.DateIssued);
      Assert.Equal(original, issued.DateModified);
      Assert.Equal("old-id", issued.CredentialId);
      Assert.Equal("1.0", issued.SchemaVersion);
      Assert.All(rows.Where(row => row.Id != issuedRowId), row => Assert.Null(row.DateIssued));

      issued.StatusId = context.SSICredentialIssuanceStatus.Single(status => status.Name == CredentialIssuanceStatus.Replay.ToString()).Id;
      await repository.Update(issued);
      var replay = repository.Query().Single(row => row.Id == issuedRowId);
      Assert.Equal(CredentialIssuanceStatus.Replay, replay.Status);
      Assert.Equal(original, replay.DateIssued);
      Assert.True(replay.DateModified > original);
      Assert.Equal("old-id", replay.CredentialId);

      replay.StatusId = pendingId;
      replay.CredentialId = null;
      replay.SchemaVersion = null;
      await repository.Update(replay);
      var pending = repository.Query().Single(row => row.Id == issuedRowId);
      Assert.Equal(CredentialIssuanceStatus.Pending, pending.Status);
      Assert.Equal(original, pending.DateIssued);
      Assert.Null(pending.CredentialId);
      Assert.Null(pending.SchemaVersion);
      await transaction.RollbackAsync(TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task PostgreSqlDeletesOnlyTheSelectedLocalArtifactAndRepeatedAbsenceIsSafe()
    {
      await using var context = new AriesCloudDbContext(new DbContextOptionsBuilder<AriesCloudDbContext>()
        .UseNpgsql(GetIsolatedConnection()).Options);
      await context.Database.OpenConnectionAsync(TestContext.Current.CancellationToken);
      await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
      await context.Database.ExecuteSqlRawAsync("""
        CREATE SCHEMA "AriesCloud";
        CREATE TABLE "AriesCloud"."Credential" (
          "Id" uuid PRIMARY KEY, "ClientReferent" text, "SourceTenantId" text, "TargetTenantId" text,
          "SchemaId" text, "ArtifactType" text, "Attributes" text, "SignedValue" text, "DateCreated" timestamptz);
        """, TestContext.Current.CancellationToken);
      var repository = new CredentialRepository(context);
      var first = await repository.Create(CreateCredential());
      var other = await repository.Create(CreateCredential());

      await repository.Delete(first);
      await repository.Delete(first);

      Assert.Equal(other.Id, Assert.Single(repository.Query()).Id);
      await transaction.RollbackAsync(TestContext.Current.CancellationToken);
    }
    #endregion Tests

    #region Private Members
    private static ApplicationDbContext CreateContext(string connection) => new(new DbContextOptionsBuilder<ApplicationDbContext>()
      .UseNpgsql(connection, options => options.UseNetTopologySuite()).Options);

    private static string GetIsolatedConnection()
    {
      var value = System.Environment.GetEnvironmentVariable("YOMA_SSI_REPLAY_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(value), "Set YOMA_SSI_REPLAY_TEST_CONNECTION to an isolated local yoma_ssi_replay_* database.");
      var builder = new NpgsqlConnectionStringBuilder(value);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_ssi_replay_", builder.Database);
      return builder.ConnectionString;
    }

    private static Infrastructure.AriesCloud.Models.Credential CreateCredential() => new()
    {
      Id = Guid.NewGuid(),
      ClientReferent = Guid.NewGuid().ToString(),
      SourceTenantId = "issuer",
      TargetTenantId = "holder",
      SchemaId = "schema",
      ArtifactType = ArtifactType.JWS.ToString(),
      Attributes = "{}",
      SignedValue = "signed"
    };
    #endregion Private Members
  }
}
