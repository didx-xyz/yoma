using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Moq;
using Npgsql;
using System.Data.Common;
using System.Security.Claims;
using Xunit;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Analytics.Services;
using Yoma.Core.Domain.Analytics.Validators;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models.Lookups;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Repositories;
using Yoma.Core.Infrastructure.Database.Lookups.Repositories;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;
using Participation = Yoma.Core.Domain.MyOpportunity.Models.MyOpportunity;
using ParticipationAction = Yoma.Core.Domain.MyOpportunity.Action;
using Gender = Yoma.Core.Domain.Core.Gender;
using VerificationStatus = Yoma.Core.Domain.MyOpportunity.VerificationStatus;

namespace Yoma.Core.Test.Analytics
{
  public class EngagementAnalyticsTests
  {
    #region Tests
    [Fact]
    public void EmptyReportKeepsZeroTotalsAndEmptySeries()
    {
      using var fixture = new Fixture();

      var result = fixture.Service.SearchEngagement(new SearchFilterEngagement());

      Assert.Equal([0, 0, 0], result.Opportunities.Engagements.Count);
      Assert.Empty(result.Opportunities.Engagements.Data);
      Assert.Equal(0, result.Opportunities.Completion.AverageTimeInDays);
      Assert.Equal(0, result.Opportunities.Engaged.Count);
      Assert.Equal(0, result.Opportunities.Reward.TotalAmount);
      Assert.Empty(result.Skills.TopCompleted.TopCompleted);
      Assert.Equal([0], result.Skills.Items.Count);
      Assert.Empty(result.Skills.Items.Data);
      Assert.Empty(result.Demographics.Ages.Items);
      Assert.Empty(result.Cumulative.Completions.Data);
    }

    [Fact]
    public void WeeklySkillsDurationsAndDemographicsMatchLegacyCalculations()
    {
      using var fixture = new Fixture();
      fixture.AddRepresentativeItems();

      AssertReport(fixture.Items, fixture.Service.SearchEngagement(new SearchFilterEngagement()));
    }

    [Fact]
    public void WeeklyChartsKeepLatest52PointsButTotalsCoverTheFullHistory()
    {
      using var fixture = new Fixture();
      var start = new DateTimeOffset(2023, 1, 1, 12, 0, 0, TimeSpan.Zero);
      for (var week = 0; week < 70; week++)
      {
        fixture.Add(ParticipationAction.Viewed, start.AddDays(week * 7));
        fixture.Add(ParticipationAction.Verification, start.AddDays(week * 7));
      }

      var result = fixture.Service.SearchEngagement(new SearchFilterEngagement());

      Assert.Equal([70, 0, 70], result.Opportunities.Engagements.Count);
      Assert.Equal(52, result.Opportunities.Engagements.Data.Count);
      Assert.Equal(52, result.Skills.Items.Data.Count);
      AssertReport(fixture.Items, result);
    }

    [Fact]
    public void CompletionDateFilteringStillIncludesUndatedCompletionsAndUsesModifiedDateForCharts()
    {
      using var fixture = new Fixture();
      fixture.AddRepresentativeItems();
      var filter = new SearchFilterEngagement
      {
        StartDate = new DateTimeOffset(2024, 6, 14, 0, 0, 0, TimeSpan.Zero),
        EndDate = new DateTimeOffset(2024, 6, 16, 0, 0, 0, TimeSpan.Zero)
      };
      var expected = fixture.Items.Where(item => item.Action == ParticipationAction.Verification
        ? !item.DateCompleted.HasValue || (item.DateCompleted >= filter.StartDate && item.DateCompleted < filter.EndDate.Value.AddDays(1))
        : item.DateModified >= filter.StartDate && item.DateModified < filter.EndDate.Value.AddDays(1)).ToList();

      AssertReport(expected, fixture.Service.SearchEngagement(filter));
    }

    [Fact]
    public void OrganizationOpportunityCategoryAndCountryFiltersRemainServerComposable()
    {
      using var fixture = new Fixture();
      fixture.AddRepresentativeItems();
      var selected = fixture.Items.First(item => item.UserCountryId.HasValue);
      var category = Guid.NewGuid();
      fixture.Categories.Add(new OpportunityCategory { OpportunityId = selected.OpportunityId, CategoryId = category });

      AssertReport([.. fixture.Items.Where(item => item.OrganizationId == selected.OrganizationId)],
        fixture.Service.SearchEngagement(new SearchFilterEngagement { Organizations = [selected.OrganizationId] }));
      AssertReport([.. fixture.Items.Where(item => item.OpportunityId == selected.OpportunityId)],
        fixture.Service.SearchEngagement(new SearchFilterEngagement { Opportunities = [selected.OpportunityId] }));
      AssertReport([.. fixture.Items.Where(item => item.OpportunityId == selected.OpportunityId)],
        fixture.Service.SearchEngagement(new SearchFilterEngagement { Categories = [category] }));
      AssertReport([.. fixture.Items.Where(item => item.UserCountryId == selected.UserCountryId)],
        fixture.Service.SearchEngagement(new SearchFilterEngagement { Countries = [selected.UserCountryId!.Value] }));
    }

    [Fact]
    public void OrganizationAuthorizationStillRunsBeforeReturningCachedReports()
    {
      using var fixture = new Fixture(cacheEnabled: true);
      fixture.AddRepresentativeItems();
      var organization = fixture.Items[0].OrganizationId;
      var filter = new SearchFilterEngagement { Organizations = [organization] };
      fixture.Service.SearchEngagement(filter);
      fixture.SetRole(Constants.Role_OrganizationAdmin);
      fixture.Organizations.Setup(service => service.IsAdminsOf(It.IsAny<List<Guid>>(), true))
        .Throws(new ValidationException("Not authorized"));

      Assert.Throws<ValidationException>(() => fixture.Service.SearchEngagement(filter));
      Assert.Throws<ValidationException>(() => fixture.Service.SearchEngagement(new SearchFilterEngagement()));
    }

    [Fact]
    public void TopOrganizationsRestOfEcosystemAndTiedSkillsRemainConsistent()
    {
      using var fixture = new Fixture();
      var date = new DateTimeOffset(2024, 12, 29, 0, 0, 0, TimeSpan.Zero);
      for (var index = 0; index < 13; index++)
      {
        var item = fixture.Add(ParticipationAction.Verification, date.AddDays(index));
        item.OrganizationId = Guid.NewGuid();
        item.OrganizationName = $"Organization {index:00}";
        item.Skills = [new Skill { Id = Guid.NewGuid(), Name = $"Skill {index:00}" }];
      }
      var duplicate = fixture.Add(ParticipationAction.Verification, date);
      duplicate.OpportunityId = fixture.Items[0].OpportunityId;
      duplicate.OrganizationId = fixture.Items[0].OrganizationId;
      duplicate.OrganizationName = fixture.Items[0].OrganizationName;
      duplicate.Skills = fixture.Items[0].Skills;

      var result = fixture.Service.SearchEngagement(new SearchFilterEngagement());

      Assert.Equal(11, result.Cumulative.Completions.Legend.Length);
      Assert.Equal("Rest of Ecosystem", result.Cumulative.Completions.Legend[^1]);
      Assert.Equal(2, result.Skills.TopCompleted.TopCompleted[0].CountCompleted);
      AssertReport(fixture.Items, result);
    }

    [Fact]
    public async Task PostgreSqlAggregatesActualRepositoryQueriesWithRetriesAndNonUtcSessionTimezone()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_ANALYTICS_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString),
        "Set YOMA_ANALYTICS_TEST_CONNECTION to an isolated local yoma_analytics_* database.");
      var builder = new NpgsqlConnectionStringBuilder(connectionString);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_analytics_", builder.Database);
      var commands = new CommandRecorder();
      await using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(builder.ConnectionString, options => options.UseNetTopologySuite().EnableRetryOnFailure())
        .AddInterceptors(commands)
        .Options);
      await context.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
      await context.Database.OpenConnectionAsync(TestContext.Current.CancellationToken);
      await context.Database.ExecuteSqlRawAsync("SET TIME ZONE 'Pacific/Auckland'", TestContext.Current.CancellationToken);
      await context.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
      {
        context.ChangeTracker.Clear();
        await using var transaction = await context.Database.BeginTransactionAsync(TestContext.Current.CancellationToken);
        using var fixture = new Fixture(new MyOpportunityRepository(context).Query(false),
          new OpportunityCategoryRepository(context).Query(), new OpportunitySkillRepository(context).Query(), new SkillRepository(context).Query());
        AssertReport([], fixture.Service.SearchEngagement(new SearchFilterEngagement()));
        fixture.AddRepresentativeItems();
        await Seed(context, fixture.Items);
        await context.Database.ExecuteSqlRawAsync("ANALYZE", TestContext.Current.CancellationToken);
        commands.Commands.Clear();

        var result = fixture.Service.SearchEngagement(new SearchFilterEngagement());

        AssertReport(fixture.Items, result);
        Assert.NotEmpty(commands.Commands);
        Assert.All(commands.Commands, sql => Assert.True(
          sql.Contains("GROUP BY", StringComparison.Ordinal) || sql.Contains("count(", StringComparison.OrdinalIgnoreCase) ||
          sql.Contains("sum(", StringComparison.OrdinalIgnoreCase) || sql.Contains("avg(", StringComparison.OrdinalIgnoreCase), sql));
        Assert.Contains(commands.Commands, sql => sql.Contains("count(DISTINCT", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(commands.Commands, sql => sql.Contains("MyOpportunityVerification", StringComparison.Ordinal));

        var selected = fixture.Items.First(item => item.UserCountryId.HasValue);
        AssertReport([.. fixture.Items.Where(item => item.OrganizationId == selected.OrganizationId)],
          fixture.Service.SearchEngagement(new SearchFilterEngagement { Organizations = [selected.OrganizationId] }));
        AssertReport([.. fixture.Items.Where(item => item.OpportunityId == selected.OpportunityId)],
          fixture.Service.SearchEngagement(new SearchFilterEngagement { Opportunities = [selected.OpportunityId] }));
        AssertReport([.. fixture.Items.Where(item => item.UserCountryId == selected.UserCountryId)],
          fixture.Service.SearchEngagement(new SearchFilterEngagement { Countries = [selected.UserCountryId!.Value] }));
        var filter = new SearchFilterEngagement { StartDate = new DateTimeOffset(2024, 6, 14, 0, 0, 0, TimeSpan.Zero), EndDate = new DateTimeOffset(2024, 6, 16, 0, 0, 0, TimeSpan.Zero) };
        var expected = fixture.Items.Where(item => item.Action == ParticipationAction.Verification
          ? !item.DateCompleted.HasValue || (item.DateCompleted >= filter.StartDate && item.DateCompleted < filter.EndDate.Value.AddDays(1))
          : item.DateModified >= filter.StartDate && item.DateModified < filter.EndDate.Value.AddDays(1)).ToList();
        AssertReport(expected, fixture.Service.SearchEngagement(filter));

        // Warm the unfiltered query before measuring; SQL compilation is not proportional to dataset size.
        fixture.Service.SearchEngagement(new SearchFilterEngagement());
        var allocated = GC.GetAllocatedBytesForCurrentThread();
        fixture.Service.SearchEngagement(new SearchFilterEngagement());
        var smallAllocations = GC.GetAllocatedBytesForCurrentThread() - allocated;
        var additionalCompletions = 100_000;
        var requestedCount = System.Environment.GetEnvironmentVariable("YOMA_ANALYTICS_TEST_COMPLETIONS");
        if (!string.IsNullOrEmpty(requestedCount))
        {
          Assert.True(int.TryParse(requestedCount, out additionalCompletions));
          Assert.InRange(additionalCompletions, 100_000, 1_000_000);
        }
        var template = fixture.Items.First(item => item.Action == ParticipationAction.Verification);
        await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "Entity"."User" ("Id", "DateCreated", "DateModified")
        SELECT md5('analytics-user-' || n)::uuid, {template.DateCreated}, {template.DateModified}
        FROM generate_series(1, {additionalCompletions}) AS n;
        INSERT INTO "Opportunity"."MyOpportunity"
          ("Id", "UserId", "OpportunityId", "ActionId", "VerificationStatusId", "DateStart", "DateEnd", "DateCompleted", "ZltoReward", "DateCreated", "DateModified")
        SELECT md5('analytics-completion-' || n)::uuid, md5('analytics-user-' || n)::uuid,
          {template.OpportunityId}, {template.ActionId}, {template.VerificationStatusId},
          {template.DateStart}, {template.DateEnd}, {template.DateCompleted}, {template.ZltoReward},
          {template.DateCreated}, {template.DateModified} - (n % 70) * interval '7 days'
        FROM generate_series(1, {additionalCompletions}) AS n;
        """, TestContext.Current.CancellationToken);
        // Bulk fixture inserts and rolled-back prior runs bypass normal autovacuum statistics refresh.
        await context.Database.ExecuteSqlRawAsync("ANALYZE", TestContext.Current.CancellationToken);
        commands.Commands.Clear();
        commands.ReadCounts.Clear();
        allocated = GC.GetAllocatedBytesForCurrentThread();

        var largeResult = fixture.Service.SearchEngagement(new SearchFilterEngagement());

        var largeAllocations = GC.GetAllocatedBytesForCurrentThread() - allocated;
        Assert.Equal(result.Opportunities.Engagements.Count[2] + additionalCompletions, largeResult.Opportunities.Engagements.Count[2]);
        Assert.Equal(result.Cumulative.Completions.Count.Sum() + additionalCompletions, largeResult.Cumulative.Completions.Count.Sum());
        Assert.Equal(52, largeResult.Opportunities.Engagements.Data.Count);
        Assert.Equal(52, largeResult.Skills.Items.Data.Count);
        Assert.Equal(result.Skills.Items.Count, largeResult.Skills.Items.Count);
        Assert.Equal(result.Skills.TopCompleted.TopCompleted[0].CountCompleted + additionalCompletions,
          largeResult.Skills.TopCompleted.TopCompleted[0].CountCompleted);
        Assert.All(commands.ReadCounts, count => Assert.InRange(count, 0, 200));
        Assert.NotEmpty(commands.ReadCounts);
        Assert.True(largeAllocations < smallAllocations + 5_000_000,
          $"Small report allocated {smallAllocations:N0} bytes; {additionalCompletions:N0}-completion report allocated {largeAllocations:N0} bytes.");
        TestContext.Current.TestOutputHelper!.WriteLine(
          $"Small allocations: {smallAllocations:N0}; {additionalCompletions:N0}-completion allocations: {largeAllocations:N0}; " +
          $"report commands: {commands.Commands.Count}; maximum reader operations: {commands.ReadCounts.Max()}.");
        foreach (var sql in commands.Commands.Where(sql => sql.Contains("OpportunitySkills", StringComparison.Ordinal)))
        {
          await using var explain = context.Database.GetDbConnection().CreateCommand();
          explain.Transaction = context.Database.CurrentTransaction!.GetDbTransaction();
          explain.CommandText = $"EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) {sql}";
          explain.CommandTimeout = builder.CommandTimeout;
          foreach (var parameter in commands.ParametersBySql[sql])
            explain.Parameters.Add(parameter);
          await using var reader = await explain.ExecuteReaderAsync(TestContext.Current.CancellationToken);
          var plan = new List<string>();
          while (await reader.ReadAsync(TestContext.Current.CancellationToken)) plan.Add(reader.GetString(0));
          Assert.Contains(plan, line => line.Contains("Aggregate", StringComparison.Ordinal));
          TestContext.Current.TestOutputHelper.WriteLine(string.Join(System.Environment.NewLine, plan));
        }
      });
    }
    #endregion

    #region Private Members
    private static DateTime WeekEnding(DateTimeOffset date)
    {
      return date.AddDays(-(int)date.DayOfWeek).AddDays(7).Date;
    }

    private static void AssertReport(List<Participation> items, SearchResultsEngagement result)
    {
      var completed = items.Where(item => item.Action == ParticipationAction.Verification &&
        item.VerificationStatus == VerificationStatus.Completed).ToList();
      var actions = new[] { ParticipationAction.Viewed, ParticipationAction.NavigatedExternalLink, ParticipationAction.Verification };
      var engaged = items.Where(item => item.Action != ParticipationAction.Verification ||
        item.VerificationStatus == VerificationStatus.Completed).ToList();
      Assert.Equal(actions.Select(action => engaged.Count(item => item.Action == action)), result.Opportunities.Engagements.Count);
      Assert.Equal(engaged.Select(item => item.OpportunityId).Distinct().Count(), result.Opportunities.Engaged.Count);
      var introduction = new DateTime(2024, 6, 16);
      var viewedSinceIntroduction = engaged.Count(item => item.Action == ParticipationAction.Viewed && WeekEnding(item.DateModified) >= introduction);
      var completedSinceIntroduction = completed.Count(item => WeekEnding(item.DateModified) >= introduction);
      var navigatedCount = engaged.Count(item => item.Action == ParticipationAction.NavigatedExternalLink);
      Assert.Equal(viewedSinceIntroduction, result.Opportunities.ConversionRate.ViewedCountFromNavigatedExternalLinkTracking);
      Assert.Equal(completedSinceIntroduction, result.Opportunities.ConversionRate.CompletedCountFromNavigatedExternalLinkTracking);
      Assert.Equal(viewedSinceIntroduction > 0 ? Math.Min(100M, Math.Round((decimal)navigatedCount / viewedSinceIntroduction * 100, 2)) : navigatedCount > 0 ? 100M : 0M,
        result.Opportunities.ConversionRate.ViewedToNavigatedExternalLinkPercentage);
      Assert.Equal(navigatedCount > 0 ? Math.Min(100M, Math.Round((decimal)completedSinceIntroduction / navigatedCount * 100, 2)) : completedSinceIntroduction > 0 ? 100M : 0M,
        result.Opportunities.ConversionRate.NavigatedExternalLinkToCompletedPercentage);
      var expectedWeeks = engaged.GroupBy(item => WeekEnding(item.DateModified))
        .OrderByDescending(group => group.Key).Take(52).Reverse().ToList();
      Assert.Equal(expectedWeeks.Select(group => group.Key), result.Opportunities.Engagements.Data.Select(item => item.Date.Date));
      Assert.Equal(expectedWeeks.Select(group => string.Join(',', actions.Select(action => group.Count(item => item.Action == action)))),
        result.Opportunities.Engagements.Data.Select(item => string.Join(',', item.Values)));
      var duration = completed.Where(item => item.DateStart.HasValue && item.DateEnd.HasValue)
        .Select(item => (item.DateEnd!.Value - item.DateStart!.Value).TotalDays).DefaultIfEmpty(0).Average();
      Assert.Equal((int)Math.Round(duration), result.Opportunities.Completion.AverageTimeInDays);
      Assert.Equal(completed.Sum(item => item.ZltoReward ?? 0), result.Opportunities.Reward.TotalAmount);
      var skills = completed.SelectMany(item => (item.Skills ?? []).Select(skill => new { item.DateModified, Skill = skill })).ToList();
      var skillCounts = skills.GroupBy(item => item.Skill.Id).ToDictionary(group => group.Key, group => group.Count());
      Assert.Equal([skillCounts.Count], result.Skills.Items.Count);
      Assert.All(result.Skills.TopCompleted.TopCompleted, skill => Assert.Equal(skillCounts[skill.Id], skill.CountCompleted));
      Assert.Equal(Math.Min(10, skillCounts.Count), result.Skills.TopCompleted.TopCompleted.Count);
      var skillWeeks = skills.GroupBy(item => WeekEnding(item.DateModified))
        .OrderByDescending(group => group.Key).Take(52).Reverse().ToList();
      Assert.Equal(skillWeeks.Select(group => group.Key), result.Skills.Items.Data.Select(item => item.Date.Date));
      Assert.Equal(skillWeeks.Select(group => group.Select(item => item.Skill.Id).Distinct().Count()),
        result.Skills.Items.Data.Select(item => Convert.ToInt32(item.Values[0])));
      var ages = completed.GroupBy(item => AgeBracket(item.UserDateOfBirth))
        .ToDictionary(group => group.Key, group => group.Count());
      Assert.Equal(ages.OrderBy(item => item.Key), result.Demographics.Ages.Items.OrderBy(item => item.Key));
      Assert.Equal(completed.GroupBy(item => string.IsNullOrEmpty(item.UserCountry) ? "Unspecified" : item.UserCountry)
        .ToDictionary(group => group.Key, group => group.Count()).OrderBy(item => item.Key), result.Demographics.Countries.Items.OrderBy(item => item.Key));
      Assert.Equal(completed.GroupBy(item => string.IsNullOrEmpty(item.UserEducation) ? "Unspecified" : item.UserEducation)
        .ToDictionary(group => group.Key, group => group.Count()).OrderBy(item => item.Key), result.Demographics.Education.Items.OrderBy(item => item.Key));
      Assert.Equal(completed.GroupBy(item => string.IsNullOrEmpty(item.UserGender) || string.Equals(item.UserGender, Gender.PreferNotToSay.ToDescription(), StringComparison.OrdinalIgnoreCase) ? "Other" : item.UserGender)
        .ToDictionary(group => group.Key, group => group.Count()).OrderBy(item => item.Key), result.Demographics.Genders.Items.OrderBy(item => item.Key));
      Assert.Equal(completed.Count, result.Cumulative.Completions.Count.Sum());
      foreach (var point in result.Cumulative.Completions.Data)
      {
        var monthEnd = point.Date.Date;
        var names = result.Cumulative.Completions.Legend;
        for (var index = 0; index < names.Length; index++)
        {
          var count = completed.Count(item => item.DateModified.Date <= monthEnd &&
            (names[index] == "Rest of Ecosystem" ? !names.Contains(item.OrganizationName) : item.OrganizationName == names[index]));
          var values = Assert.IsType<List<int>>(Assert.Single(point.Values));
          Assert.Equal(count, values[index]);
        }
      }
    }

    private static string AgeBracket(DateTimeOffset? birthDate)
    {
      if (!birthDate.HasValue) return "Unspecified";
      var now = DateTimeOffset.UtcNow;
      var age = now.Year - birthDate.Value.Year -
        (now.Month < birthDate.Value.Month || (now.Month == birthDate.Value.Month && now.Day < birthDate.Value.Day) ? 1 : 0);
      return age >= 30 ? "30+" : age >= 25 ? "25-29" : age >= 20 ? "20-24" : age >= 0 ? "0-19" : "Unspecified";
    }

    private static async Task Seed(ApplicationDbContext context, List<Participation> items)
    {
      var now = DateTimeOffset.UtcNow;
      var status = new Infrastructure.Database.Entity.Entities.Lookups.OrganizationStatus { Id = Guid.NewGuid(), Name = "Active" };
      var opportunityStatus = new Infrastructure.Database.Opportunity.Entities.Lookups.OpportunityStatus { Id = Guid.NewGuid(), Name = "Active" };
      var type = new Infrastructure.Database.Opportunity.Entities.Lookups.OpportunityType { Id = Guid.NewGuid(), Name = "Learning", DisplayName = "Learning" };
      context.AddRange(status, opportunityStatus, type);
      foreach (var action in items.DistinctBy(item => item.ActionId))
        context.Add(new Infrastructure.Database.MyOpportunity.Entities.Lookups.MyOpportunityAction { Id = action.ActionId, Name = action.Action.ToString() });
      foreach (var statusItem in items.Where(item => item.VerificationStatusId.HasValue).DistinctBy(item => item.VerificationStatusId))
        context.Add(new Infrastructure.Database.MyOpportunity.Entities.Lookups.MyOpportunityVerificationStatus
        { Id = statusItem.VerificationStatusId!.Value, Name = statusItem.VerificationStatus!.Value.ToString() });
      foreach (var skill in items.SelectMany(item => item.Skills ?? []).DistinctBy(skill => skill.Id))
        context.Add(new Infrastructure.Database.Lookups.Entities.Skill
        { Id = skill.Id, Name = skill.Name, InfoURL = skill.InfoURL, ExternalId = skill.Id.ToString(), DateCreated = now, DateModified = now });
      foreach (var item in items.Where(item => item.UserCountryId.HasValue).DistinctBy(item => item.UserCountryId))
        context.Add(new Infrastructure.Database.Lookups.Entities.Country
        { Id = item.UserCountryId!.Value, Name = item.UserCountry!, CodeAlpha2 = "ZA", CodeAlpha3 = "ZAF", CodeNumeric = "710", DateCreated = now });
      var educationIds = items.Where(item => !string.IsNullOrEmpty(item.UserEducation)).Select(item => item.UserEducation!).Distinct().ToDictionary(name => name, _ => Guid.NewGuid());
      foreach (var education in educationIds)
        context.Add(new Infrastructure.Database.Lookups.Entities.Education { Id = education.Value, Name = education.Key, DateCreated = now });
      var genderIds = items.Where(item => !string.IsNullOrEmpty(item.UserGender)).Select(item => item.UserGender!).Distinct().ToDictionary(name => name, _ => Guid.NewGuid());
      foreach (var gender in genderIds)
        context.Add(new Infrastructure.Database.Lookups.Entities.Gender { Id = gender.Value, Name = gender.Key, DateCreated = now });
      foreach (var item in items.DistinctBy(item => item.UserId))
        context.Add(new Infrastructure.Database.Entity.Entities.User
        {
          Id = item.UserId,
          DateOfBirth = item.UserDateOfBirth,
          CountryId = item.UserCountryId,
          EducationId = string.IsNullOrEmpty(item.UserEducation) ? null : educationIds[item.UserEducation],
          GenderId = string.IsNullOrEmpty(item.UserGender) ? null : genderIds[item.UserGender],
          DateCreated = now,
          DateModified = now
        });
      foreach (var item in items.DistinctBy(item => item.OrganizationId))
        context.Add(new Infrastructure.Database.Entity.Entities.Organization
        {
          Id = item.OrganizationId,
          Name = item.OrganizationName,
          NameHashValue = item.OrganizationId.ToString(),
          StatusId = status.Id,
          CreatedByUserId = items[0].UserId,
          ModifiedByUserId = items[0].UserId,
          DateCreated = now,
          DateModified = now
        });
      foreach (var item in items.DistinctBy(item => item.OpportunityId))
      {
        context.Add(new Infrastructure.Database.Opportunity.Entities.Opportunity
        {
          Id = item.OpportunityId,
          Title = item.OpportunityId.ToString(),
          Description = "Analytics regression",
          TypeId = type.Id,
          OrganizationId = item.OrganizationId,
          StatusId = opportunityStatus.Id,
          DateStart = now,
          CreatedByUserId = items[0].UserId,
          ModifiedByUserId = items[0].UserId,
          DateCreated = now,
          DateModified = now
        });
        foreach (var skill in item.Skills ?? [])
          context.Add(new Infrastructure.Database.Opportunity.Entities.OpportunitySkill
          { Id = Guid.NewGuid(), OpportunityId = item.OpportunityId, SkillId = skill.Id, DateCreated = now });
      }
      foreach (var item in items)
        context.Add(new Infrastructure.Database.MyOpportunity.Entities.MyOpportunity
        {
          Id = item.Id,
          UserId = item.UserId,
          OpportunityId = item.OpportunityId,
          ActionId = item.ActionId,
          VerificationStatusId = item.VerificationStatusId,
          DateStart = item.DateStart,
          DateEnd = item.DateEnd,
          DateCompleted = item.DateCompleted,
          DateCreated = item.DateCreated,
          DateModified = item.DateModified,
          ZltoReward = item.ZltoReward
        });
      await context.SaveChangesAsync(TestContext.Current.CancellationToken);
      context.ChangeTracker.Clear();
    }
    #endregion

    #region Fixture
    private sealed class Fixture : IDisposable
    {
      internal static readonly Guid CompletedId = Guid.NewGuid();
      private readonly Dictionary<ParticipationAction, Guid> _actions = Enum.GetValues<ParticipationAction>().ToDictionary(action => action, _ => Guid.NewGuid());
      private readonly MemoryCache _cache = new(new MemoryCacheOptions());
      private readonly HttpContextAccessor _http = new() { HttpContext = new DefaultHttpContext() };
      private readonly Guid _organizationId = Guid.NewGuid();
      private readonly Guid _countryId = Guid.NewGuid();
      private readonly Skill _skill = new() { Id = Guid.NewGuid(), Name = "Communication", InfoURL = "https://example.org/skills/communication" };
      internal List<Participation> Items { get; } = [];
      internal List<OpportunityCategory> Categories { get; } = [];
      internal Mock<IOrganizationService> Organizations { get; } = new();
      internal AnalyticsService Service { get; }

      internal Fixture(IQueryable<Participation>? query = null, IQueryable<OpportunityCategory>? categories = null,
        IQueryable<OpportunitySkill>? opportunitySkills = null, IQueryable<Skill>? skills = null, bool cacheEnabled = false)
      {
        SetRole(Constants.Role_Admin);
        Organizations.Setup(service => service.EnsureExist(It.IsAny<List<Guid>>(), false)).Returns(true);
        var actions = new Mock<IMyOpportunityActionService>();
        actions.Setup(service => service.GetByName(It.IsAny<string>())).Returns((string name) =>
          new MyOpportunityAction { Id = _actions[Enum.Parse<ParticipationAction>(name)], Name = name });
        var statuses = new Mock<IMyOpportunityVerificationStatusService>();
        statuses.Setup(service => service.GetByName(VerificationStatus.Completed.ToString()))
          .Returns(new MyOpportunityVerificationStatus { Id = CompletedId, Name = VerificationStatus.Completed.ToString() });
        var repository = new Mock<IRepositoryBatchedWithNavigationAndCustomFieldFilter<Participation>>();
        repository.Setup(value => value.Query(false)).Returns(query ?? Items.AsQueryable());
        var categoryRepository = new Mock<IRepository<OpportunityCategory>>();
        categoryRepository.Setup(value => value.Query()).Returns(categories ?? Categories.AsQueryable());
        var opportunitySkillRepository = new Mock<IRepository<OpportunitySkill>>();
        opportunitySkillRepository.Setup(value => value.Query()).Returns(() => opportunitySkills ?? Items
          .SelectMany(item => (item.Skills ?? []).Select(skill => new OpportunitySkill { OpportunityId = item.OpportunityId, SkillId = skill.Id }))
          .DistinctBy(item => (item.OpportunityId, item.SkillId)).AsQueryable());
        var skillRepository = new Mock<IRepositoryBatchedValueContains<Skill>>();
        skillRepository.Setup(value => value.Query()).Returns(() => skills ?? Items.SelectMany(item => item.Skills ?? []).DistinctBy(skill => skill.Id).AsQueryable());
        Service = new AnalyticsService(
          Options.Create(new AppSettings { CacheEnabledByCacheItemTypes = cacheEnabled ? "Analytics" : "", CacheAbsoluteExpirationRelativeToNowInHoursAnalytics = 1 }),
          _cache, _http, Organizations.Object, Mock.Of<IOrganizationStatusService>(), Mock.Of<IUserService>(),
          actions.Object, statuses.Object, Mock.Of<IBlobService>(), Mock.Of<ICountryService>(),
          Mock.Of<ISSICredentialIssuanceStatusService>(), Mock.Of<ISSISchemaTypeService>(), Mock.Of<IOpportunityStatusService>(),
          new OrganizationSearchFilterEngagementValidator(Organizations.Object), new OrganizationSearchFilterOpportunityValidator(Organizations.Object),
          new OrganizationSearchFilterYouthValidator(Organizations.Object), new OrganizationSearchFilterSSOValidator(Organizations.Object),
          Mock.Of<IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilter<Domain.Opportunity.Models.Opportunity>>(), repository.Object,
          categoryRepository.Object, opportunitySkillRepository.Object, skillRepository.Object,
          Mock.Of<IRepository<UserLoginHistory>>(), Mock.Of<IRepositoryBatchedValueContainsWithNavigation<Organization>>(),
          Mock.Of<IRepository<SSICredentialIssuance>>(), Mock.Of<IRepository<OpportunityCountry>>());
      }

      internal Participation Add(ParticipationAction action, DateTimeOffset modified)
      {
        var item = new Participation
        {
          Id = Guid.NewGuid(),
          UserId = Guid.NewGuid(),
          OpportunityId = Guid.NewGuid(),
          OrganizationId = _organizationId,
          OrganizationName = "Organization A",
          ActionId = _actions[action],
          Action = action,
          VerificationStatusId = action == ParticipationAction.Verification ? CompletedId : null,
          VerificationStatus = action == ParticipationAction.Verification ? VerificationStatus.Completed : null,
          DateCreated = modified,
          DateModified = modified,
          DateCompleted = modified,
          DateStart = modified.AddDays(-2.5),
          DateEnd = modified,
          ZltoReward = 2.5m,
          UserCountryId = _countryId,
          UserCountry = "South Africa",
          Skills = [_skill]
        };
        Items.Add(item);
        return item;
      }

      internal void AddRepresentativeItems()
      {
        var start = new DateTimeOffset(2024, 6, 14, 23, 59, 59, TimeSpan.Zero);
        Add(ParticipationAction.Viewed, start.AddDays(-10));
        Add(ParticipationAction.Viewed, start);
        Add(ParticipationAction.NavigatedExternalLink, start.AddDays(1));
        Add(ParticipationAction.Verification, start.AddDays(1));
        Add(ParticipationAction.Verification, start.AddSeconds(1));
        Add(ParticipationAction.Verification, start.AddDays(2));
        Add(ParticipationAction.Verification, start.AddMonths(1));
        Items[^1].DateCompleted = null;
        Items[^1].Skills = [];
        Items[^1].DateStart = null;
        Add(ParticipationAction.Verification, new DateTimeOffset(2025, 1, 1, 0, 0, 0, TimeSpan.Zero));
        Items[^1].OrganizationId = Guid.NewGuid();
        Items[^1].OrganizationName = "Organization B";
        Items[^1].Skills = [new Skill { Id = Guid.NewGuid(), Name = "Leadership" }, _skill];
        Items[^1].ZltoReward = null;
        Add(ParticipationAction.Verification, start);
        Items[^1].VerificationStatus = VerificationStatus.Pending;
        Items[^1].VerificationStatusId = Guid.NewGuid();
        Add(ParticipationAction.Verification, new DateTimeOffset(2024, 4, 6, 23, 59, 59, TimeSpan.Zero));
        Add(ParticipationAction.Verification, new DateTimeOffset(2024, 9, 28, 23, 59, 59, TimeSpan.Zero));
        Add(ParticipationAction.Verification, new DateTimeOffset(2024, 9, 28, 0, 30, 0, TimeSpan.Zero));
        Add(ParticipationAction.Verification, new DateTimeOffset(1900, 2, 28, 12, 0, 0, TimeSpan.Zero));
        Add(ParticipationAction.Verification, new DateTimeOffset(2000, 2, 29, 12, 0, 0, TimeSpan.Zero));
        Add(ParticipationAction.Verification, new DateTimeOffset(2100, 2, 28, 12, 0, 0, TimeSpan.Zero));
        Add(ParticipationAction.Verification, new DateTimeOffset(2400, 2, 29, 12, 0, 0, TimeSpan.Zero));
        var now = DateTimeOffset.UtcNow;
        var birthdays = new DateTimeOffset?[] { now.AddYears(-30), now.AddYears(-25), now.AddYears(-20), now.AddYears(-19), now.AddDays(1), null };
        for (var index = 0; index < Items.Count; index++)
        {
          Items[index].UserDateOfBirth = birthdays[index % birthdays.Length];
          Items[index].UserEducation = index % 2 == 0 ? "Secondary" : null;
          Items[index].UserGender = index % 3 == 0 ? "Female" : index % 3 == 1 ? Gender.PreferNotToSay.ToDescription() : null;
          if (index % 3 != 0) continue;
          Items[index].UserCountryId = null;
          Items[index].UserCountry = null;
        }
      }

      internal void SetRole(string role)
      {
        _http.HttpContext!.User = new ClaimsPrincipal(new ClaimsIdentity(
          [new Claim(Constants.ClaimType_Role, role)], "Test", ClaimTypes.Name, Constants.ClaimType_Role));
      }

      public void Dispose() => _cache.Dispose();
    }

    private sealed class CommandRecorder : DbCommandInterceptor
    {
      internal List<string> Commands { get; } = [];
      internal List<int> ReadCounts { get; } = [];
      internal Dictionary<string, NpgsqlParameter[]> ParametersBySql { get; } = [];

      public override InterceptionResult<DbDataReader> ReaderExecuting(DbCommand command, CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
      {
        Commands.Add(command.CommandText);
        ParametersBySql[command.CommandText] = [.. command.Parameters.Cast<NpgsqlParameter>()
          .Select(parameter => new NpgsqlParameter(parameter.ParameterName, parameter.NpgsqlDbType) { Value = parameter.Value })];
        return result;
      }

      public override InterceptionResult DataReaderDisposing(DbCommand command, DataReaderDisposingEventData eventData,
        InterceptionResult result)
      {
        ReadCounts.Add(eventData.ReadCount);
        return result;
      }
    }
    #endregion
  }
}
