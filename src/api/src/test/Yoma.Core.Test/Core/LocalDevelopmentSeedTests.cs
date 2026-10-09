using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.SSI.Helpers;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;

namespace Yoma.Core.Test.Core
{
  public class LocalDevelopmentSeedTests
  {
    #region Tests
    [Fact]
    public async Task FreshMigrationsAndLocalSeedsProvideDeterministicSearchAndCompletionExamples()
    {
      var connectionString = System.Environment.GetEnvironmentVariable("YOMA_LOCAL_SEED_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString), "Set YOMA_LOCAL_SEED_TEST_CONNECTION to a local disposable PostgreSQL server.");

      var connection = new NpgsqlConnectionStringBuilder(connectionString);
      Assert.True(connection.Host is "localhost" or "127.0.0.1");
      Assert.StartsWith("yoma_core_seed_", connection.Database);

      // Own a fresh database, never clear the supplied database or reuse its data.
      connection.Database = $"yoma_core_seed_{Guid.NewGuid():N}";
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(connection.ConnectionString, options => options.UseNetTopologySuite())
        .Options);
      context.Database.SetCommandTimeout(180);
      var cancellationToken = TestContext.Current.CancellationToken;

      try
      {
        await context.Database.MigrateAsync(cancellationToken);
        Assert.False(context.Database.HasPendingModelChanges());

        // The real Skill catalogue is loaded separately by the Local/Dev setup.
        // A small isolated catalogue keeps this test independent of external APIs.
        context.Skill.AddRange(Enumerable.Range(1, 12).Select(index =>
          new Infrastructure.Database.Lookups.Entities.Skill
          {
            Id = Guid.NewGuid(),
            Name = $"Isolated seed skill {index:00}",
            ExternalId = $"isolated-seed-{index:00}",
            DateCreated = DateTimeOffset.UtcNow,
            DateModified = DateTimeOffset.UtcNow
          }));
        await context.SaveChangesAsync(cancellationToken);

        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory != null && !File.Exists(Path.Combine(directory.FullName,
          "cicd", "scripts", "postgressql-init", "post.sql")))
          directory = directory.Parent;
        Assert.NotNull(directory);

        var script = await File.ReadAllTextAsync(Path.Combine(directory.FullName,
          "cicd", "scripts", "postgressql-init", "post.sql"), cancellationToken);
        await context.Database.ExecuteSqlRawAsync(script, cancellationToken);

        var repository = new OpportunityRepository(context);
        var credentialOpportunities = await repository.Query()
          .Where(opportunity => opportunity.CredentialIssuanceEnabled)
          .ToListAsync(cancellationToken);
        Assert.NotEmpty(credentialOpportunities);
        Assert.All(credentialOpportunities, opportunity =>
          Assert.Equal(SSISSchemaHelper.ToDefaultFullName(opportunity.Type), opportunity.SSISchemaName));

        var queuedSchemas = await context.SSICredentialIssuance
          .Where(issuance => issuance.MyOpportunityId != null)
          .Join(context.MyOpportunity, issuance => issuance.MyOpportunityId, participation => participation.Id,
            (issuance, participation) => new { issuance.SchemaName, participation.OpportunityId })
          .Join(context.Opportunity, issuance => issuance.OpportunityId, opportunity => opportunity.Id,
            (issuance, opportunity) => new { issuance.SchemaName, opportunity.SSISchemaName })
          .ToListAsync(cancellationToken);
        Assert.NotEmpty(queuedSchemas);
        Assert.All(queuedSchemas, item => Assert.Equal(item.SSISchemaName, item.SchemaName));

        var fixtures = await repository.Query(true)
          .Where(opportunity => opportunity.Title.StartsWith("Search fixture "))
          .ToListAsync(cancellationToken);
        Assert.Equal(24, fixtures.Count);

        var job = Assert.Single(fixtures, opportunity => opportunity.Title.StartsWith("Search fixture 01 - "));
        Assert.Equal(Domain.Opportunity.Type.Job, job.Type);
        Assert.True(job.Incentivized);
        Assert.Equal(RewardType.None, job.RewardType);
        Assert.Null(job.ZltoReward);
        var country = Assert.Single(job.Countries!);
        Assert.Equal("Cape Town", country.City);

        var countries = new OpportunityCountryRepository(context);
        Assert.Contains(job.Id, await countries.WithinRadius(countries.Query(), [18.4231, -33.9221], 10)
          .Select(mapping => mapping.OpportunityId).ToListAsync(cancellationToken));
        var salary = await context.CustomFieldValue
          .Where(value => value.OpportunityId == job.Id && value.CustomFieldDefinition.Key == "jobSalaryMinimum")
          .SingleAsync(cancellationToken);
        Assert.Equal(1000m, salary.ValueNumeric);

        var onRequestEvent = Assert.Single(fixtures, opportunity => opportunity.Title.StartsWith("Search fixture 04 - "));
        Assert.Equal(Domain.Opportunity.Type.Event, onRequestEvent.Type);
        Assert.Equal(AccessibilitySupport.AvailableOnRequest, onRequestEvent.AccessibilitySupport);
        Assert.Contains(onRequestEvent.Accommodations!, accommodation => accommodation.Name == "Quiet workspace");
        Assert.Contains(await context.MyOpportunity
          .Where(completion => completion.OpportunityId == onRequestEvent.Id)
          .Select(completion => completion.VerificationStatus!.Name).ToListAsync(cancellationToken),
          status => status == "Pending");

        var placement = await context.MyOpportunity
          .SingleAsync(completion => completion.OpportunityId == job.Id && completion.VerificationStatus!.Name == "Completed",
            cancellationToken);
        var startDate = await context.CustomFieldValue
          .SingleAsync(value => value.MyOpportunityId == placement.Id && value.CustomFieldDefinition.Key == "jobEmploymentStartDate",
            cancellationToken);
        Assert.Equal(DateTimeOffset.UtcNow.AddDays(-7).ToString("yyyy-MM-dd"), startDate.Value);
        Assert.NotNull(startDate.ValueDateTime);
        Assert.Null(placement.ZltoReward);

        var incompleteIds = fixtures.Where(opportunity => opportunity.Title.Contains("incomplete partner-like"))
          .Select(opportunity => opportunity.Id).ToList();
        Assert.Equal(9, incompleteIds.Count);
        Assert.False(await context.CustomFieldValue.AnyAsync(value => value.OpportunityId.HasValue &&
          incompleteIds.Contains(value.OpportunityId.Value), cancellationToken));

        var future = Assert.Single(fixtures, opportunity => opportunity.Title.StartsWith("Search fixture 08 - "));
        Assert.True(future.DateStart > DateTimeOffset.UtcNow.AddDays(29));
        Assert.True(future.DateEnd > DateTimeOffset.UtcNow.AddDays(89));
        Assert.False(await context.UserPreferences.AnyAsync(cancellationToken));
        Assert.False(await context.User.AnyAsync(user => user.Region != null || user.City != null ||
          user.Coordinates != null || user.LocationSource != null, cancellationToken));
        Assert.All(fixtures, opportunity => Assert.InRange(opportunity.Languages!.Count, 0, 3));
        Assert.All(fixtures, opportunity => Assert.InRange(opportunity.Skills!.Count, 0, 4));
      }
      finally
      {
        // Cleanup is restricted to the uniquely named database created by this test.
        await context.Database.EnsureDeletedAsync(CancellationToken.None);
      }
    }
    #endregion
  }
}
