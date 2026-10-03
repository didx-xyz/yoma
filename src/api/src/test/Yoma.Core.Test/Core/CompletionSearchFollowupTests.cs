using CsvHelper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Moq;
using System.Reflection;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.MyOpportunity.Services;
using Yoma.Core.Domain.MyOpportunity.Validators;
using Yoma.Core.Infrastructure.Database.Context;

namespace Yoma.Core.Test.Core
{
  public class CompletionSearchFollowupTests
  {
    #region Public Members
    [Theory]
    [InlineData(Domain.Opportunity.Type.Job, false)]
    [InlineData(Domain.Opportunity.Type.Entrepreneurship, false)]
    [InlineData(Domain.Opportunity.Type.Learning, true)]
    [InlineData(Domain.Opportunity.Type.Event, true)]
    public void PlacementMayOmitTimingButLearningAndEventsStillRequireIt(Domain.Opportunity.Type type, bool required)
    {
      var request = new MyOpportunityRequestVerify { DateEnd = DateTimeOffset.UtcNow };
      var validator = new MyOpportunityRequestValidatorVerify(Mock.Of<ITimeIntervalService>());
      var context = new ValidationContext<MyOpportunityRequestVerify>(request);
      context.RootContextData[nameof(Domain.Opportunity.Models.Opportunity.Type)] = type;

      var errors = validator.Validate(context).Errors;
      Assert.Equal(required, errors.Any(o => o.PropertyName == nameof(request.DateStart)));
      Assert.Equal(required, errors.Any(o => o.PropertyName == nameof(request.CommitmentInterval)));

      request.DateStart = request.DateEnd.Value.AddDays(1);
      Assert.Contains(validator.Validate(context).Errors, o => o.PropertyName == nameof(request.DateEnd));
    }

    [Fact]
    public void JobDoesNotDeriveParticipationFromAdvertisedEffort()
    {
      var request = new MyOpportunityRequestVerify();
      var opportunity = new Domain.Opportunity.Models.Opportunity
      {
        Type = Domain.Opportunity.Type.Job,
        CommitmentIntervalId = Guid.NewGuid(),
        CommitmentInterval = TimeIntervalOption.Hour,
        CommitmentIntervalCount = 4
      };
      var defaults = typeof(MyOpportunityService).GetMethod("PerformActionSendForVerificationApplyDefaults",
        BindingFlags.Static | BindingFlags.NonPublic)!;
      defaults.Invoke(null, [request, opportunity, new MyOpportunityVerificationOptions()]);

      Assert.NotNull(request.DateEnd);
      Assert.Null(request.DateStart);
      Assert.Null(request.CommitmentInterval);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void CompletionSampleRequiresCFPrefixAndIncludesAllVentureFields(bool prefixed)
    {
      var directory = new DirectoryInfo(AppContext.BaseDirectory);
      while (directory != null && !File.Exists(Path.Combine(directory.FullName, "other", "MyOpportunityInfoCsvImport_Sample.csv")))
        directory = directory.Parent;
      Assert.NotNull(directory);
      var sample = File.ReadAllText(Path.Combine(directory.FullName, "other", "MyOpportunityInfoCsvImport_Sample.csv"));
      if (!prefixed) sample = sample.Replace(CSVImportHelper.CustomField_Header_Prefix, "");
      using var reader = new StringReader(sample);
      var errors = new List<CSVImportErrorRow>();
      using var csv = new CsvReader(reader, CSVImportHelper.CreateConfig<MyOpportunityInfoCsvImport>(errors));
      var headers = CSVImportHelper.ValidateHeader<MyOpportunityInfoCsvImport>(csv, errors, true);

      if (prefixed)
      {
        Assert.Empty(errors);
        Assert.Equal(15, headers!.Count);
        Assert.Equal(12, headers.Count(o => o.StartsWith("CF:entrepreneurship", StringComparison.Ordinal)));
      }
      else Assert.Contains(errors.SelectMany(o => o.Items), o => o.Type == CSVImportErrorType.HeaderUnexpectedColumn);
    }

    [Fact]
    public async Task OpportunityRootRemainsLockedWhenProjectionHasCollections()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_SEARCH_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString), "Set YOMA_SEARCH_TEST_CONNECTION to a seeded disposable database.");
      var builder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
      Assert.StartsWith("yoma_core_search_", builder.Database);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(connectionString, options => options.UseNetTopologySuite())
        .AddInterceptors(new Infrastructure.Shared.Interceptors.ForUpdateInterceptor()).Options);
      var cancellationToken = TestContext.Current.CancellationToken;
      var id = await context.Opportunity.Select(o => o.Id).FirstAsync(cancellationToken);
      await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
      var repository = new Infrastructure.Database.Opportunity.Repositories.OpportunityRepository(context);

      foreach (var includeChildren in new[] { false, true })
      {
        var opportunity = await repository.Query(includeChildren, LockMode.Wait)
          .SingleAsync(o => o.Id == id, cancellationToken);
        Assert.Equal(id, opportunity.Id);
        var rootLocks = await context.Database.SqlQuery<int>($"""
          SELECT COUNT(*)::integer AS "Value"
          FROM pg_locks
          WHERE pid = pg_backend_pid()
            AND relation = '"Opportunity"."Opportunity"'::regclass
            AND mode = 'RowShareLock'
          """).SingleAsync(cancellationToken);
        Assert.True(rootLocks > 0, "The root opportunity must be row-locked, not silently read without a lock.");
      }
      await transaction.RollbackAsync(cancellationToken);
    }

    [Fact]
    public async Task ExistingSingleEngagementSelectionsMigrateWithoutInventingOrLosingData()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_SEARCH_UPGRADE_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString), "Set YOMA_SEARCH_UPGRADE_TEST_CONNECTION to a fresh isolated database.");
      var builder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
      Assert.StartsWith("yoma_core_upgrade_", builder.Database);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      // Each run starts fresh; never downgrade or clear a supplied existing database.
      builder.Database = $"yoma_core_upgrade_{Guid.NewGuid():N}";
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.UseNetTopologySuite()).Options);
      var cancellationToken = TestContext.Current.CancellationToken;
      var migrator = context.GetService<IMigrator>();
      await migrator.MigrateAsync("20260922063352_ApplicationDb_CF_Configuration", cancellationToken);
      var first = Guid.NewGuid();
      var empty = Guid.NewGuid();
      var remote = new Guid("0b2aaf7a-fdcf-4015-9668-d06bdebafa09");
      var created = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
      await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "Entity"."User" ("Id", "Email", "YoIDOnboarded", "DateCreated", "DateModified")
        VALUES ({first}, 'upgrade-selected@example.invalid', false, {created}, {created}),
          ({empty}, 'upgrade-empty@example.invalid', false, {created}, {created});
        INSERT INTO "Entity"."UserPreferences" ("UserId", "EngagementTypeId", "DateCreated", "DateModified")
        VALUES ({first}, {remote}, {created}, {created}), ({empty}, NULL, {created}, {created});
        """, cancellationToken);
      await migrator.MigrateAsync(cancellationToken: cancellationToken);

      var migrated = Assert.Single(await context.UserPreferenceEngagementTypes.ToListAsync(cancellationToken));
      Assert.Equal(first, migrated.UserId);
      Assert.Equal(remote, migrated.EngagementTypeId);
      Assert.Equal(created, migrated.DateCreated);
      Assert.Equal(2, await context.UserPreferences.CountAsync(cancellationToken));
      Assert.False(context.Database.HasPendingModelChanges());
    }
    #endregion
  }
}
