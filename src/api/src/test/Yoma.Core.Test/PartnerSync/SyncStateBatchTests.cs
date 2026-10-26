using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Npgsql;
using System.Data.Common;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.PartnerSync;
using Yoma.Core.Domain.PartnerSync.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Domain.PartnerSync.Services;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.PartnerSync.Repositories;

namespace Yoma.Core.Test.PartnerSync
{
  public class SyncStateBatchTests
  {
    #region Class Variables
    private static readonly string[] _verificationScenarios = ["none", "aborted", "pull", "latest-error", "latest-pending", "latest-delete"];
    private static readonly string[] _invalidScenarios = ["mixed", "multiple-pull", "case-variants", "invalid-type"];
    private static readonly ProcessingStatus[] _historyStatuses =
      [ProcessingStatus.Processed, ProcessingStatus.Error, ProcessingStatus.Pending, ProcessingStatus.Aborted];
    #endregion

    #region Tests
    [Theory]
    [InlineData("none")]
    [InlineData("aborted")]
    [InlineData("pull")]
    [InlineData("push")]
    [InlineData("latest-error")]
    [InlineData("latest-pending")]
    [InlineData("latest-delete")]
    [InlineData("mixed")]
    [InlineData("multiple-pull")]
    [InlineData("case-variants")]
    [InlineData("invalid-type")]
    [InlineData("partner-deduplication")]
    public void VerificationSingleAndBatchPreserveLegacyResultsAndExceptions(string scenario)
    {
      var fixture = new Fixture();
      var id = Guid.NewGuid();
      fixture.PopulateVerification(id, scenario);
      var expectedError = Record.Exception(() => LegacyVerification(fixture.Rows, id));

      if (expectedError != null)
      {
        var single = Record.Exception(() => fixture.Service.GetSyncInfoMyOpportunity(id));
        var batch = Record.Exception(() => fixture.Service.GetSyncInfoMyOpportunity([id]));
        Assert.Equal(expectedError.GetType(), single?.GetType());
        Assert.Equal(expectedError.Message, single?.Message);
        Assert.Equal(expectedError.GetType(), batch?.GetType());
        Assert.Equal(expectedError.Message, batch?.Message);
      }
      else
      {
        AssertVerificationInfo(LegacyVerification(fixture.Rows, id), fixture.Service.GetSyncInfoMyOpportunity(id));
        AssertVerificationInfo(LegacyVerification(fixture.Rows, id), fixture.Service.GetSyncInfoMyOpportunity([id])[id]);
      }
    }

    [Fact]
    public void EmptyVerificationBatchSkipsStorageAndEmptyIdRetainsOriginalError()
    {
      var fixture = new Fixture();
      Assert.Empty(fixture.Service.GetSyncInfoMyOpportunity([]));
      var single = Assert.Throws<ArgumentNullException>(() => fixture.Service.GetSyncInfoMyOpportunity(Guid.Empty));
      var batch = Assert.Throws<ArgumentNullException>(() => fixture.Service.GetSyncInfoMyOpportunity([Guid.Empty]));
      Assert.Equal(single.Message, batch.Message);
      fixture.Logs.VerifyNoOtherCalls();
      fixture.Statuses.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PostgreSqlVerificationBatchPreservesNullsAndReadsOnlyRequestedSubmissions()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_SYNC_STATE_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString), "Set YOMA_SYNC_STATE_TEST_CONNECTION to an isolated local yoma_sync_state_* database.");
      var builder = new NpgsqlConnectionStringBuilder(connectionString);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_sync_state_", builder.Database);
      var recorder = new CommandRecorder();
      await using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.EnableRetryOnFailure())
        .AddInterceptors(recorder).Options);
      await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
      await context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
      {
        context.ChangeTracker.Clear();
        await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
        var source = new Fixture();
        var ids = Enumerable.Range(0, 12).Select(_ => Guid.NewGuid()).ToList();
        for (var index = 0; index < ids.Count; index++)
          source.PopulateVerification(ids[index], _verificationScenarios[index % _verificationScenarios.Length]);
        source.PopulateVerification(Guid.NewGuid(), "invalid-type");
        var wrongEntity = source.Add(Guid.NewGuid(), SyncType.Push, SyncPartner.SAYouth);
        wrongEntity.MyOpportunityId = ids[0];
        await Seed(context, source.Rows);
        var fixture = new Fixture(new ProcessingLogRepository(context).Query());
        recorder.Commands.Clear();
        recorder.ReadCounts.Clear();

        var result = fixture.Service.GetSyncInfoMyOpportunity([.. ids, .. ids.Take(2)]);

        var sql = Assert.Single(recorder.Commands);
        Assert.Contains("ANY", sql, StringComparison.Ordinal);
        Assert.Equal(ids, result.Keys);
        Assert.Equal(source.Rows.Count(row => row.EntityType == EntityType.MyOpportunity.ToString() && row.MyOpportunityId.HasValue &&
          ids.Contains(row.MyOpportunityId.Value) && row.StatusId != Fixture.AbortedId) + 1, Assert.Single(recorder.ReadCounts));
        foreach (var id in ids)
        {
          AssertVerificationInfo(LegacyVerification(source.Rows, id), result[id]);
          AssertVerificationInfo(fixture.Service.GetSyncInfoMyOpportunity(id), result[id]);
        }
        await transaction.RollbackAsync(TestContext.Current.CancellationToken);
      });
    }

    [Theory]
    [InlineData("none")]
    [InlineData("aborted")]
    [InlineData("pull")]
    [InlineData("push")]
    [InlineData("latest-error")]
    [InlineData("latest-pending")]
    [InlineData("latest-delete")]
    [InlineData("mixed")]
    [InlineData("multiple-pull")]
    [InlineData("case-variants")]
    [InlineData("invalid-type")]
    [InlineData("partner-deduplication")]
    public void SingleAndBatchPreserveLegacyResultsAndExceptions(string scenario)
    {
      var fixture = new Fixture();
      var id = Guid.NewGuid();
      var url = "https://example.org/opportunity";
      fixture.Populate(id, scenario);
      var legacyError = Record.Exception(() => Legacy(fixture.Rows, id, url));

      if (legacyError != null)
      {
        var singleError = Record.Exception(() => fixture.Service.GetSyncInfo(EntityType.Opportunity, id, url));
        var batchError = Record.Exception(() => fixture.Service.GetSyncInfo(EntityType.Opportunity, new Dictionary<Guid, string?> { [id] = url }));
        Assert.Equal(legacyError.GetType(), singleError?.GetType());
        Assert.Equal(legacyError.Message, singleError?.Message);
        Assert.Equal(legacyError.GetType(), batchError?.GetType());
        Assert.Equal(legacyError.Message, batchError?.Message);
      }
      else
      {
        AssertInfo(Legacy(fixture.Rows, id, url), fixture.Service.GetSyncInfo(EntityType.Opportunity, id, url));
        AssertInfo(Legacy(fixture.Rows, id, url), fixture.Service.GetSyncInfo(EntityType.Opportunity,
          new Dictionary<Guid, string?> { [id] = url })[id]);
      }
    }

    [Fact]
    public void BatchIsolatesEntitiesUrlsAndUnrelatedInvalidLogs()
    {
      var fixture = new Fixture();
      var urls = new Dictionary<Guid, string?>();
      for (var index = 0; index < 12; index++)
      {
        var id = Guid.NewGuid();
        urls.Add(id, index % 2 == 0 ? null : $"https://example.org/{index}");
        fixture.Populate(id, index % 3 == 0 ? "none" : index % 3 == 1 ? "push" : "pull");
      }
      fixture.Populate(Guid.NewGuid(), "invalid-type");
      var wrongEntity = fixture.Add(urls.Keys.First(), SyncType.Pull, SyncPartner.Jobberman);
      wrongEntity.EntityType = EntityType.MyOpportunity.ToString();
      var noOpportunity = fixture.Add(Guid.NewGuid(), SyncType.Pull, SyncPartner.Jobberman);
      noOpportunity.OpportunityId = null;

      var result = fixture.Service.GetSyncInfo(EntityType.Opportunity, urls);

      Assert.Equal(urls.Keys, result.Keys);
      foreach (var item in urls)
        AssertInfo(Legacy(fixture.Rows, item.Key, item.Value), result[item.Key]);
      fixture.Logs.Verify(repository => repository.Query(), Times.Once);
    }

    [Fact]
    public void EmptyBatchDoesNotQueryStorageOrLookups()
    {
      var fixture = new Fixture();

      Assert.Empty(fixture.Service.GetSyncInfo(EntityType.Opportunity, new Dictionary<Guid, string?>()));
      fixture.Logs.VerifyNoOtherCalls();
      fixture.Statuses.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("https://example.org/opportunity")]
    public void BatchPreservesSuppliedUrlWithoutNormalization(string? url)
    {
      var fixture = new Fixture();
      var id = Guid.NewGuid();
      fixture.Populate(id, "pull");

      var result = fixture.Service.GetSyncInfo(EntityType.Opportunity, new Dictionary<Guid, string?> { [id] = url });

      AssertInfo(Legacy(fixture.Rows, id, url), result[id]);
    }

    [Fact]
    public void UnsupportedEntityTypeRetainsTheSingleItemError()
    {
      var fixture = new Fixture();
      var id = Guid.NewGuid();

      var single = Assert.Throws<InvalidOperationException>(() => fixture.Service.GetSyncInfo(EntityType.MyOpportunity, id, null));
      var batch = Assert.Throws<InvalidOperationException>(() =>
        fixture.Service.GetSyncInfo(EntityType.MyOpportunity, new Dictionary<Guid, string?> { [id] = null }));
      Assert.Equal(single.Message, batch.Message);
    }

    [Fact]
    public async Task PostgreSqlBatchReadsOnlyRequestedEntitiesInOneQuery()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_SYNC_STATE_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString),
        "Set YOMA_SYNC_STATE_TEST_CONNECTION to an isolated local yoma_sync_state_* database.");
      var builder = new NpgsqlConnectionStringBuilder(connectionString);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_sync_state_", builder.Database);
      var recorder = new CommandRecorder();
      await using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.EnableRetryOnFailure())
        .AddInterceptors(recorder)
        .Options);
      await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
      await context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
      {
        context.ChangeTracker.Clear();
        await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
        var source = new Fixture();
        var urls = new Dictionary<Guid, string?>();
        for (var index = 0; index < 12; index++)
        {
          var id = Guid.NewGuid();
          urls.Add(id, index % 2 == 0 ? null : $"https://example.org/{index}");
          source.Populate(id, index % 3 == 0 ? "none" : index % 3 == 1 ? "push" : "pull");
        }
        source.Populate(Guid.NewGuid(), "invalid-type");
        source.Populate(Guid.NewGuid(), "push");
        await Seed(context, source.Rows);
        var fixture = new Fixture(new ProcessingLogRepository(context).Query());
        recorder.Commands.Clear();
        recorder.ReadCounts.Clear();

        var result = fixture.Service.GetSyncInfo(EntityType.Opportunity, urls);

        var sql = Assert.Single(recorder.Commands);
        Assert.Contains("ANY", sql, StringComparison.Ordinal);
        Assert.Contains("ORDER BY", sql, StringComparison.Ordinal);
        // EF counts Read calls, including the final false returned at the end of enumeration.
        Assert.Equal(source.Rows.Count(row => row.OpportunityId.HasValue && urls.ContainsKey(row.OpportunityId.Value) && row.StatusId != Fixture.AbortedId) + 1,
          Assert.Single(recorder.ReadCounts));
        foreach (var item in urls)
        {
          AssertInfo(Legacy(source.Rows, item.Key, item.Value), result[item.Key]);
          AssertInfo(fixture.Service.GetSyncInfo(EntityType.Opportunity, item.Key, item.Value), result[item.Key]);
        }

        await transaction.RollbackAsync(TestContext.Current.CancellationToken);
      });
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PostgreSqlMaximumPageAndLongHistoriesPreserveLegacyResultsAndErrors(bool verification)
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_SYNC_STATE_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString),
        "Set YOMA_SYNC_STATE_TEST_CONNECTION to an isolated local yoma_sync_state_* database.");
      var builder = new NpgsqlConnectionStringBuilder(connectionString);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_sync_state_", builder.Database);
      var recorder = new CommandRecorder();
      await using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.EnableRetryOnFailure())
        .AddInterceptors(recorder)
        .Options);
      await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
      await context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
      {
        context.ChangeTracker.Clear();
        await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
        var source = new Fixture();
        var ids = Enumerable.Range(0, 1000).Select(_ => Guid.NewGuid()).ToList();
        for (var index = 0; index < ids.Count; index++)
        {
          if (index % 10 == 0) continue;
          for (var history = 0; history < 32; history++)
          {
            var status = index % 10 == 1 ? ProcessingStatus.Aborted : _historyStatuses[history % _historyStatuses.Length];
            var partner = verification ? SyncPartner.Jobberman : history % 2 == 0 ? SyncPartner.SAYouth : SyncPartner.Alison;
            var row = source.Add(ids[index], verification ? SyncType.Pull : SyncType.Push, partner, status);
            if (verification)
            {
              row.MyOpportunityId = row.OpportunityId;
              row.OpportunityId = null;
              row.EntityType = EntityType.MyOpportunity.ToString();
            }
            if (history % 5 == 0) row.Action = SyncAction.Delete.ToString();
            if (history % 11 == 0) row.EntityExternalId = null;
          }
        }

        // Malformed histories outside the page must not affect the page; verify their errors separately.
        var invalidIds = new List<Guid>();
        foreach (var scenario in _invalidScenarios)
        {
          var id = Guid.NewGuid();
          invalidIds.Add(id);
          if (verification) source.PopulateVerification(id, scenario);
          else source.Populate(id, scenario);
        }
        await Seed(context, source.Rows);
        var fixture = new Fixture(new ProcessingLogRepository(context).Query());
        recorder.Commands.Clear();
        recorder.ReadCounts.Clear();

        if (verification)
        {
          var result = fixture.Service.GetSyncInfoMyOpportunity(ids);
          Assert.Single(recorder.Commands);
          Assert.Equal(ids, result.Keys);
          foreach (var id in ids)
            AssertVerificationInfo(LegacyVerification(source.Rows, id), result[id]);
        }
        else
        {
          var urls = ids.ToDictionary(id => id, id => (string?)$"https://example.org/{id}");
          var result = fixture.Service.GetSyncInfo(EntityType.Opportunity, urls);
          Assert.Single(recorder.Commands);
          Assert.Equal(ids, result.Keys);
          foreach (var item in urls)
            AssertInfo(Legacy(source.Rows, item.Key, item.Value), result[item.Key]);
        }

        var sql = Assert.Single(recorder.Commands);
        Assert.Contains("ANY", sql, StringComparison.Ordinal);
        Assert.Contains("ORDER BY", sql, StringComparison.Ordinal);
        Assert.Equal(source.Rows.Count(row => row.StatusId != Fixture.AbortedId &&
          (verification ? row.MyOpportunityId.HasValue && ids.Contains(row.MyOpportunityId.Value)
            : row.OpportunityId.HasValue && ids.Contains(row.OpportunityId.Value))) + 1, Assert.Single(recorder.ReadCounts));

        foreach (var id in invalidIds)
        {
          var expected = Record.Exception(() =>
          {
            if (verification) LegacyVerification(source.Rows, id);
            else Legacy(source.Rows, id, null);
          });
          Assert.NotNull(expected);
          var single = Record.Exception(() =>
          {
            if (verification) fixture.Service.GetSyncInfoMyOpportunity(id);
            else fixture.Service.GetSyncInfo(EntityType.Opportunity, id, null);
          });
          var batch = Record.Exception(() =>
          {
            if (verification) fixture.Service.GetSyncInfoMyOpportunity([id]);
            else fixture.Service.GetSyncInfo(EntityType.Opportunity, new Dictionary<Guid, string?> { [id] = null });
          });
          Assert.Equal(expected.GetType(), single?.GetType());
          Assert.Equal(expected.Message, single?.Message);
          Assert.Equal(expected.GetType(), batch?.GetType());
          Assert.Equal(expected.Message, batch?.Message);
        }
        await transaction.RollbackAsync(TestContext.Current.CancellationToken);
      });
    }
    #endregion

    #region Private Members
    private static SyncInfoMyOpportunity? LegacyVerification(IEnumerable<ProcessingLog> rows, Guid id)
    {
      var items = rows.Where(row => row.EntityType == EntityType.MyOpportunity.ToString() && row.MyOpportunityId == id && row.StatusId != Fixture.AbortedId)
        .OrderByDescending(row => row.DateModified).GroupBy(row => new { row.SyncType, row.PartnerId }).Select(group => group.First()).ToList();
      if (items.Count == 0) return null;
      var types = items.Select(row => Enum.Parse<SyncType>(row.SyncType, true)).Distinct().ToList();
      if (types.Count > 1)
        throw new DataInconsistencyException($"MyOpportunity '{id}' has mixed synchronization types recorded in processing logs");
      var type = types.Single();
      if (type != SyncType.Pull)
        throw new DataInconsistencyException($"MyOpportunity synchronization only supports pull synchronization for entity '{id}'");
      var partners = items.Select(row => new SyncInfoMyOpportunityPartner
      {
        Partner = row.Partner,
        EntityType = Enum.Parse<EntityType>(row.EntityType, true),
        ExternalId = row.EntityExternalId
      }).DistinctBy(item => new { item.Partner, item.ExternalId }).ToList();
      if (partners.Count != 1)
        throw new DataInconsistencyException($"MyOpportunity pull synchronization requires exactly one partner for entity '{id}'");
      return new SyncInfoMyOpportunity { SyncType = type, Partners = partners };
    }

    private static void AssertVerificationInfo(SyncInfoMyOpportunity? expected, SyncInfoMyOpportunity? actual)
    {
      if (expected == null)
      {
        Assert.Null(actual);
        return;
      }
      Assert.NotNull(actual);
      Assert.Equal(expected.SyncType, actual.SyncType);
      Assert.Equal(expected.Locked, actual.Locked);
      Assert.Equal(expected.Partners.Select(item => (item.Partner, item.EntityType, item.ExternalId)),
        actual.Partners.Select(item => (item.Partner, item.EntityType, item.ExternalId)));
    }

    // Independent copy of the pre-batch domain selection, used to detect outcome changes in both paths.
    private static SyncInfoEntity? Legacy(IEnumerable<ProcessingLog> rows, Guid id, string? url)
    {
      var items = rows.Where(row => row.EntityType == EntityType.Opportunity.ToString() && row.OpportunityId == id && row.StatusId != Fixture.AbortedId)
        .OrderByDescending(row => row.DateModified)
        .GroupBy(row => new { row.SyncType, row.PartnerId }).Select(group => group.First()).ToList();
      if (items.Count == 0) return null;
      var types = items.Select(row => Enum.Parse<SyncType>(row.SyncType, true)).Distinct().ToList();
      if (types.Count > 1)
        throw new DataInconsistencyException($"Entity '{id}' of type '{EntityType.Opportunity}' has mixed synchronization types recorded in processing logs");
      var type = types.Single();
      var partners = items.Select(row => new SyncInfoEntityPartner
      {
        Partner = row.Partner,
        EntityType = Enum.Parse<EntityType>(row.EntityType, true),
        ExternalId = row.EntityExternalId,
        URL = url
      }).DistinctBy(item => new { item.Partner, item.ExternalId }).ToList();
      if (type == SyncType.Pull && partners.Count != 1)
        throw new DataInconsistencyException($"Pull synchronization requires exactly one partner for entity '{id}' of type '{EntityType.Opportunity}'");
      return new SyncInfoEntity { SyncType = type, Partners = partners };
    }

    private static void AssertInfo(SyncInfoEntity? expected, SyncInfoEntity? actual)
    {
      if (expected == null)
      {
        Assert.Null(actual);
        return;
      }
      Assert.NotNull(actual);
      Assert.Equal(expected.SyncType, actual.SyncType);
      Assert.Equal(expected.Locked, actual.Locked);
      Assert.Equal(expected.Partners.Select(item => (item.Partner, item.EntityType, item.ExternalId, item.URL)),
        actual.Partners.Select(item => (item.Partner, item.EntityType, item.ExternalId, item.URL)));
    }

    private static async Task Seed(ApplicationDbContext context, List<ProcessingLog> rows)
    {
      var now = DateTimeOffset.UtcNow;
      var userId = Guid.NewGuid();
      var organizationId = Guid.NewGuid();
      var organizationStatusId = Guid.NewGuid();
      var opportunityStatusId = Guid.NewGuid();
      var typeId = Guid.NewGuid();
      context.Add(new Infrastructure.Database.Entity.Entities.User { Id = userId, DateCreated = now, DateModified = now });
      context.Add(new Infrastructure.Database.Entity.Entities.Lookups.OrganizationStatus { Id = organizationStatusId, Name = "Active" });
      context.Add(new Infrastructure.Database.Opportunity.Entities.Lookups.OpportunityStatus { Id = opportunityStatusId, Name = "Active" });
      context.Add(new Infrastructure.Database.Opportunity.Entities.Lookups.OpportunityType { Id = typeId, Name = "Learning", DisplayName = "Learning" });
      context.Add(new Infrastructure.Database.Entity.Entities.Organization
      {
        Id = organizationId,
        Name = "Sync state fixture",
        NameHashValue = organizationId.ToString(),
        StatusId = organizationStatusId,
        CreatedByUserId = userId,
        ModifiedByUserId = userId,
        DateCreated = now,
        DateModified = now
      });
      var verificationIds = rows.Where(row => row.MyOpportunityId.HasValue).Select(row => row.MyOpportunityId!.Value).Distinct().ToList();
      foreach (var id in rows.Where(row => row.OpportunityId.HasValue).Select(row => row.OpportunityId!.Value).Concat(verificationIds).Distinct())
        context.Add(new Infrastructure.Database.Opportunity.Entities.Opportunity
        {
          Id = id,
          Title = id.ToString(),
          Description = "Sync state batch fixture",
          OrganizationId = organizationId,
          StatusId = opportunityStatusId,
          TypeId = typeId,
          DateStart = now,
          CreatedByUserId = userId,
          ModifiedByUserId = userId,
          DateCreated = now,
          DateModified = now
        });
      if (verificationIds.Count != 0)
      {
        var actionId = Guid.NewGuid();
        context.Add(new Infrastructure.Database.MyOpportunity.Entities.Lookups.MyOpportunityAction
        { Id = actionId, Name = Domain.MyOpportunity.Action.Verification.ToString() });
        foreach (var id in verificationIds)
          context.Add(new Infrastructure.Database.MyOpportunity.Entities.MyOpportunity
          { Id = id, UserId = userId, OpportunityId = id, ActionId = actionId, DateCreated = now, DateModified = now });
      }
      foreach (var row in rows.DistinctBy(row => row.PartnerId))
        context.Add(new Infrastructure.Database.PartnerSync.Entities.Lookups.Partner
        { Id = row.PartnerId, Name = row.Partner.ToString(), Active = true, SyncCapabilities = "{}", DateCreated = now });
      foreach (var row in rows.DistinctBy(row => row.StatusId))
        context.Add(new Infrastructure.Database.PartnerSync.Entities.Lookups.ProcessingStatus
        { Id = row.StatusId, Name = row.Status.ToString(), DateCreated = now });
      foreach (var row in rows)
        context.Add(new Infrastructure.Database.PartnerSync.Entities.ProcessingLog
        {
          Id = row.Id,
          OpportunityId = row.OpportunityId,
          MyOpportunityId = row.MyOpportunityId,
          EntityType = row.EntityType,
          PartnerId = row.PartnerId,
          SyncType = row.SyncType,
          Action = row.Action,
          StatusId = row.StatusId,
          EntityExternalId = row.EntityExternalId,
          DateCreated = row.DateCreated,
          DateModified = row.DateModified
        });
      await context.SaveChangesAsync(TestContext.Current.CancellationToken);
      context.ChangeTracker.Clear();
    }
    #endregion

    #region Fixture
    private sealed class Fixture
    {
      internal static readonly Guid AbortedId = Guid.NewGuid();
      private static readonly Guid ProcessedId = Guid.NewGuid();
      private static readonly Guid ErrorId = Guid.NewGuid();
      private static readonly Guid PendingId = Guid.NewGuid();
      private readonly Dictionary<SyncPartner, Guid> _partnerIds = Enum.GetValues<SyncPartner>().ToDictionary(partner => partner, _ => Guid.NewGuid());
      internal List<ProcessingLog> Rows { get; } = [];
      internal Mock<IRepositoryBatched<ProcessingLog>> Logs { get; } = new();
      internal Mock<IProcessingStatusService> Statuses { get; } = new();
      internal SyncStateService Service { get; }

      internal Fixture(IQueryable<ProcessingLog>? query = null)
      {
        Logs.Setup(repository => repository.Query()).Returns(() => query ?? Rows.AsQueryable());
        Statuses.Setup(service => service.GetByName(ProcessingStatus.Aborted.ToString())).Returns(
          new Domain.PartnerSync.Models.Lookups.ProcessingStatus { Id = AbortedId, Name = ProcessingStatus.Aborted.ToString() });
        Service = new SyncStateService(Statuses.Object, Mock.Of<IProcessingHelperService>(), Logs.Object,
          Mock.Of<IPartnerService>(), Mock.Of<IRepository<PartnerUser>>());
      }

      internal ProcessingLog Add(Guid id, SyncType type, SyncPartner partner, ProcessingStatus status = ProcessingStatus.Processed)
      {
        var item = new ProcessingLog
        {
          Id = Guid.NewGuid(),
          OpportunityId = id,
          EntityType = EntityType.Opportunity.ToString(),
          SyncType = type.ToString(),
          PartnerId = _partnerIds[partner],
          Partner = partner,
          EntityExternalId = Guid.NewGuid().ToString(),
          StatusId = status switch
          {
            ProcessingStatus.Aborted => AbortedId,
            ProcessingStatus.Error => ErrorId,
            ProcessingStatus.Pending => PendingId,
            ProcessingStatus.Processed => ProcessedId,
            _ => throw new NotSupportedException($"Status '{status}' is not supported")
          },
          Status = status,
          Action = SyncAction.Create.ToString(),
          DateCreated = DateTimeOffset.UtcNow.AddDays(-1),
          DateModified = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero).AddMinutes(Rows.Count)
        };
        Rows.Add(item);
        return item;
      }

      internal void Populate(Guid id, string scenario)
      {
        switch (scenario)
        {
          case "none": break;
          case "aborted": Add(id, SyncType.Pull, SyncPartner.Jobberman, ProcessingStatus.Aborted); break;
          case "pull":
            Add(id, SyncType.Pull, SyncPartner.Jobberman);
            Add(id, SyncType.Pull, SyncPartner.Jobberman);
            Add(id, SyncType.Push, SyncPartner.Alison, ProcessingStatus.Aborted);
            break;
          case "push":
            Add(id, SyncType.Push, SyncPartner.SAYouth);
            Add(id, SyncType.Push, SyncPartner.Alison);
            Add(id, SyncType.Push, SyncPartner.SAYouth);
            break;
          case "latest-error":
            Add(id, SyncType.Push, SyncPartner.SAYouth);
            Add(id, SyncType.Push, SyncPartner.SAYouth, ProcessingStatus.Error).EntityExternalId = null;
            break;
          case "latest-pending":
            Add(id, SyncType.Push, SyncPartner.SAYouth);
            Add(id, SyncType.Push, SyncPartner.SAYouth, ProcessingStatus.Pending);
            break;
          case "latest-delete":
            Add(id, SyncType.Push, SyncPartner.SAYouth);
            Add(id, SyncType.Push, SyncPartner.SAYouth).Action = SyncAction.Delete.ToString();
            break;
          case "mixed":
            Add(id, SyncType.Pull, SyncPartner.Jobberman);
            Add(id, SyncType.Push, SyncPartner.Alison);
            break;
          case "multiple-pull":
            Add(id, SyncType.Pull, SyncPartner.Jobberman);
            Add(id, SyncType.Pull, SyncPartner.Alison);
            break;
          case "case-variants":
            Add(id, SyncType.Pull, SyncPartner.Jobberman);
            Add(id, SyncType.Pull, SyncPartner.Jobberman).SyncType = "pull";
            break;
          case "invalid-type": Add(id, SyncType.Pull, SyncPartner.Jobberman).SyncType = "invalid"; break;
          case "partner-deduplication":
            var first = Add(id, SyncType.Push, SyncPartner.SAYouth);
            var second = Add(id, SyncType.Push, SyncPartner.SAYouth);
            second.PartnerId = Guid.NewGuid();
            second.EntityExternalId = first.EntityExternalId;
            break;
          default: throw new NotSupportedException($"Scenario '{scenario}' is not supported");
        }
      }

      internal void PopulateVerification(Guid id, string scenario)
      {
        Populate(id, scenario);
        foreach (var row in Rows.Where(row => row.OpportunityId == id))
        {
          row.MyOpportunityId = id;
          row.OpportunityId = null;
          row.EntityType = EntityType.MyOpportunity.ToString();
          if (scenario is "latest-error" or "latest-pending" or "latest-delete" or "partner-deduplication")
            row.SyncType = SyncType.Pull.ToString();
        }
      }
    }

    private sealed class CommandRecorder : DbCommandInterceptor
    {
      internal List<string> Commands { get; } = [];
      internal List<int> ReadCounts { get; } = [];

      public override InterceptionResult<DbDataReader> ReaderExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result)
      {
        Commands.Add(command.CommandText);
        return result;
      }

      public override InterceptionResult DataReaderDisposing(DbCommand command, DataReaderDisposingEventData eventData, InterceptionResult result)
      {
        ReadCounts.Add(eventData.ReadCount);
        return result;
      }
    }
    #endregion
  }
}
