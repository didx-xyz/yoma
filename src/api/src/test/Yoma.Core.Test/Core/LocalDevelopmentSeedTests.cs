using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
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

        // Credential labels are stored exactly in metadata, not formatted when a wallet is read.
        var schemaLabels = await context.SSISchemaEntityProperties.Select(property => property.NameDisplay)
          .ToListAsync(cancellationToken);
        Assert.NotEmpty(schemaLabels);
        Assert.All(schemaLabels, label => Assert.All(label.Split(' '), word =>
          Assert.True(!char.IsLetter(word[0]) || char.IsUpper(word[0]), $"Seed label '{label}' is not Title Case.")));
        Assert.Contains("Date Of Birth", schemaLabels);
        Assert.Contains("Logo URL", schemaLabels);
        Assert.Contains("ZLTO Reward", schemaLabels);
        Assert.Contains("Skills Earned", schemaLabels);
        Assert.Contains("User", schemaLabels);
        Assert.Contains("Engagement", schemaLabels);
        Assert.Contains("Duration", schemaLabels);
        Assert.DoesNotContain("User Display Name", schemaLabels);
        Assert.DoesNotContain("Engagement Type", schemaLabels);
        Assert.DoesNotContain("Participation Commitment", schemaLabels);

        var completionOrders = await context.SSISchemaEntityProperties
          .Where(property => property.Group == "Completion Details")
          .Select(property => property.SortOrder).ToListAsync(cancellationToken);

        var definitions = await context.CustomFieldDefinition.ToListAsync(cancellationToken);
        Assert.Equal(39, definitions.Count);
        Assert.All(definitions, definition =>
        {
          Assert.StartsWith(definition.EntityContext!, definition.Key);
          Assert.All(definition.Title.Split(' '), word =>
            Assert.True(!char.IsLetter(word[0]) || char.IsUpper(word[0]), $"Field label '{definition.Title}' is not Title Case."));
        });
        var reach = Assert.Single(definitions, definition => definition.Key == "EntrepreneurshipCustomerReach");
        Assert.Equal("Customer Reach", reach.Title);
        Assert.Equal(new Guid("cf0e0001-0929-4cf0-a100-000000000022"), reach.Id);
        var ventureFields = definitions.Where(definition => definition.EntityType == "MyOpportunity"
          && definition.EntityContext == "Entrepreneurship").ToList();
        Assert.Equal(12, ventureFields.Count);
        Assert.All(ventureFields, definition => Assert.Equal("Completion Details", definition.Group));
        Assert.Equal(Enumerable.Range(1, 25).Select(position => (int?)position),
          completionOrders.Concat(ventureFields.Select(definition => (int?)definition.SortOrder)).Order());

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

        await AssertLocationAndProviderSeedFixtures(context, cancellationToken);

        await AssertCompletionLocationRepositoryRoundTrip(context, cancellationToken);
        await AssertProviderRepositoryRoundTrip(context, cancellationToken);
        await AssertGlobalTextSearchTargets(context, cancellationToken);

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
          .Where(opportunity => EF.Functions.Like(opportunity.Title, "__ - %"))
          .ToListAsync(cancellationToken);
        Assert.Equal(24, fixtures.Count);

        var job = Assert.Single(fixtures, opportunity => opportunity.Title.StartsWith("01 - "));
        Assert.Equal(Domain.Opportunity.Type.Job, job.Type);
        Assert.True(job.Incentivized);
        Assert.Equal(RewardType.None, job.RewardType);
        Assert.Null(job.ZltoReward);
        Assert.True(job.CredentialIssuanceEnabled);
        Assert.Equal(SSISSchemaHelper.ToDefaultFullName(Domain.Opportunity.Type.Job), job.SSISchemaName);
        var country = Assert.Single(job.Countries!);
        Assert.Equal("Cape Town", country.City);

        var countries = new OpportunityCountryRepository(context);
        Assert.Contains(job.Id, await countries.WithinRadius(countries.Query(), [18.4231, -33.9221], 10)
          .Select(mapping => mapping.OpportunityId).ToListAsync(cancellationToken));
        var salary = await context.CustomFieldValue
          .Where(value => value.OpportunityId == job.Id && value.CustomFieldDefinition.Key == "JobSalaryMinimum")
          .SingleAsync(cancellationToken);
        Assert.Equal(1000m, salary.ValueNumeric);

        var onRequestEvent = Assert.Single(fixtures, opportunity => opportunity.Title.StartsWith("04 - "));
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
          .SingleAsync(value => value.MyOpportunityId == placement.Id && value.CustomFieldDefinition.Key == "JobEmploymentStartDate",
            cancellationToken);
        Assert.Equal(DateTimeOffset.UtcNow.AddDays(-7).ToString("yyyy-MM-dd"), startDate.Value);
        Assert.NotNull(startDate.ValueDateTime);
        Assert.Null(placement.ZltoReward);

        var placementIssuance = await context.SSICredentialIssuance
          .SingleAsync(issuance => issuance.MyOpportunityId == placement.Id, cancellationToken);
        Assert.Equal("Opportunity|Job|Default", placementIssuance.SchemaName);
        Assert.Equal("JWS", placementIssuance.ArtifactType);
        Assert.Null(placementIssuance.CredentialId);
        Assert.Null(placementIssuance.SchemaVersion);

        var incompleteIds = fixtures.Where(opportunity => opportunity.Title.Contains("incomplete partner-like"))
          .Select(opportunity => opportunity.Id).ToList();
        Assert.Equal(9, incompleteIds.Count);
        Assert.False(await context.CustomFieldValue.AnyAsync(value => value.OpportunityId.HasValue &&
          incompleteIds.Contains(value.OpportunityId.Value), cancellationToken));

        var future = Assert.Single(fixtures, opportunity => opportunity.Title.StartsWith("08 - "));
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

    #region Private Members
    private static async Task AssertLocationAndProviderSeedFixtures(ApplicationDbContext context, CancellationToken cancellationToken)
    {
      var repository = new Infrastructure.Database.MyOpportunity.Repositories.MyOpportunityRepository(context);
      var actionId = await context.MyOpportunityAction
        .Where(item => item.Name == nameof(Domain.MyOpportunity.Action.Verification))
        .Select(item => item.Id)
        .SingleAsync(cancellationToken);
      var outcomes = await repository.Query(true)
        .Where(item => item.ActionId == actionId && EF.Functions.Like(item.OpportunityTitle, "__ - %"))
        .ToListAsync(cancellationToken);
      Assert.Equal(9, outcomes.Count);

      var expected = new[]
      {
        (Number: 1, Type: Domain.Opportunity.Type.Job, Location: "Cape Town, Western Cape, South Africa"),
        (Number: 10, Type: Domain.Opportunity.Type.Learning, Location: (string?)null),
        (Number: 13, Type: Domain.Opportunity.Type.Learning, Location: "Cape Town, Western Cape, South Africa"),
        (Number: 14, Type: Domain.Opportunity.Type.Event, Location: "Cape Town, Western Cape, South Africa"),
        (Number: 19, Type: Domain.Opportunity.Type.ImpactAction, Location: "Cape Town, Western Cape, South Africa"),
        (Number: 20, Type: Domain.Opportunity.Type.Entrepreneurship, Location: "Johannesburg, Gauteng, South Africa"),
        (Number: 23, Type: Domain.Opportunity.Type.Other, Location: "South Africa")
      };
      var completed = outcomes.Where(item => item.VerificationStatus == Domain.MyOpportunity.VerificationStatus.Completed)
        .ToList();
      Assert.Equal(expected.Length, completed.Count);
      Assert.Equal(6, completed.Select(item => item.OpportunityType).Distinct().Count());
      foreach (var fixture in expected)
      {
        var outcome = Assert.Single(completed, item => item.OpportunityTitle.StartsWith($"{fixture.Number:00} - "));
        Assert.Equal(fixture.Type, outcome.OpportunityType);
        Assert.Equal(fixture.Location, outcome.Location);
        Assert.NotNull(outcome.DateCompleted);
        Assert.Equal(SSISSchemaHelper.ToDefaultFullName(fixture.Type), outcome.OpportunitySSISchemaName);
        var issuance = await context.SSICredentialIssuance
          .SingleAsync(item => item.MyOpportunityId == outcome.Id, cancellationToken);
        Assert.Equal(outcome.OpportunitySSISchemaName, issuance.SchemaName);
        Assert.Equal("JWS", issuance.ArtifactType);
        Assert.Equal("Pending", await context.SSICredentialIssuanceStatus
          .Where(status => status.Id == issuance.StatusId)
          .Select(status => status.Name)
          .SingleAsync(cancellationToken));
        Assert.Null(issuance.CredentialId);
        Assert.Null(issuance.SchemaVersion);
      }

      var pending = outcomes.Where(item => item.VerificationStatus == Domain.MyOpportunity.VerificationStatus.Pending)
        .ToList();
      Assert.Equal(2, pending.Count);
      Assert.Null(Assert.Single(pending, item => item.OpportunityTitle.StartsWith("04 - ")).Location);
      Assert.Equal("Johannesburg, Gauteng, South Africa",
        Assert.Single(pending, item => item.OpportunityTitle.StartsWith("05 - ")).Location);
      Assert.All(pending, item => Assert.Null(item.DateCompleted));
      var pendingIds = pending.Select(item => item.Id).ToList();
      Assert.False(await context.SSICredentialIssuance
        .AnyAsync(item => item.MyOpportunityId.HasValue && pendingIds.Contains(item.MyOpportunityId.Value), cancellationToken));

      // The new synthetic outcomes do not populate unknown generic/history rows.
      Assert.False(await context.MyOpportunity
        .Where(item => !EF.Functions.Like(item.Opportunity.Title, "__ - %"))
        .AnyAsync(item => item.CountryId != null || item.Region != null || item.City != null, cancellationToken));

      var opportunities = await new OpportunityRepository(context).Query(true)
        .Where(item => EF.Functions.Like(item.Title, "__ - %"))
        .ToListAsync(cancellationToken);
      foreach (var opportunity in opportunities)
      {
        var countries = opportunity.Countries!;
        Assert.False(countries.Any(country => country.CodeAlpha2 == "WW") && countries.Count > 1);
        if (opportunity.Provider == null)
        {
          Assert.Null(opportunity.ProviderURL);
          Assert.Null(opportunity.ProviderLogoURL);
          Assert.Null(opportunity.ProviderCountryId);
          continue;
        }

        Assert.Equal("https://example.com/provider", opportunity.ProviderURL);
        Assert.Equal("https://yoma.world/yoma-icon-192.png", opportunity.ProviderLogoURL);
        Assert.NotNull(opportunity.ProviderCountryId);
        Assert.NotNull(opportunity.ProviderCountry);
      }
      Assert.Equal(8, opportunities.Count(item => item.Provider == null));
      var worldwide = Assert.Single(opportunities, item => item.Title.StartsWith("23 - "));
      Assert.Equal("WW", Assert.Single(worldwide.Countries!).CodeAlpha2);
      Assert.Equal("Ireland", worldwide.ProviderCountry);
      Assert.Equal("WW", Assert.Single(opportunities.Single(item => item.Title.StartsWith("24 - ")).Countries!).CodeAlpha2);
      var hybrid = Assert.Single(opportunities, item => item.Title.StartsWith("14 - "));
      Assert.Equal(Domain.Core.EngagementTypeOption.Hybrid, hybrid.EngagementType);
    }

    private static async Task AssertGlobalTextSearchTargets(ApplicationDbContext context, CancellationToken cancellationToken)
    {
      var repository = new OpportunityRepository(context);
      await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
      var item = await repository.Query(false).FirstAsync(cancellationToken);
      var fields = new[]
      {
        nameof(item.Title),
        nameof(item.Summary),
        nameof(item.Provider),
        nameof(item.KeywordsFlattened),
        nameof(item.Description)
      };
      const string value = "GlobalSearchRegression";

      foreach (var field in fields)
      {
        item.Title = $"Unmatched title {item.Id}";
        item.Summary = null;
        item.Provider = null;
        item.KeywordsFlattened = null;
        item.Description = "Unmatched content";
        switch (field)
        {
          case nameof(item.Title):
            item.Title = value;
            break;
          case nameof(item.Summary):
            item.Summary = value;
            break;
          case nameof(item.Provider):
            item.Provider = value;
            break;
          case nameof(item.KeywordsFlattened):
            item.KeywordsFlattened = value;
            break;
          case nameof(item.Description):
            item.Description = value;
            break;
          default:
            throw new NotSupportedException($"Global text search test field '{field}' is not supported.");
        }

        await repository.Update(item);
        var matches = await repository.Contains(repository.Query(false), value.ToLowerInvariant())
          .Select(result => result.Id)
          .ToListAsync(cancellationToken);
        Assert.Equal(item.Id, Assert.Single(matches));
      }

      await transaction.RollbackAsync(cancellationToken);
      context.ChangeTracker.Clear();
    }

    private static async Task AssertProviderRepositoryRoundTrip(ApplicationDbContext context, CancellationToken cancellationToken)
    {
      var repository = new OpportunityRepository(context);
      var country = await context.Country.SingleAsync(item => item.CodeAlpha2 == "ZA", cancellationToken);
      var items = new List<Domain.Opportunity.Models.Opportunity>();
      for (var index = 0; index < 2; index++)
      {
        var item = await repository.Query().FirstAsync(cancellationToken);
        item.Id = Guid.NewGuid();
        item.Title = $"Provider round-trip {item.Id}";
        item.ExternalId = null;
        item.Provider = "Isolated search-only publisher";
        item.ProviderURL = "https://example.com/provider";
        item.ProviderLogoURL = "https://example.com/provider-logo.png";
        item.ProviderCountryId = country.Id;
        items.Add(item);
      }
      items[0] = await repository.Create(items[0]);
      items[1] = Assert.Single(await repository.Create([items[1]]));
      context.ChangeTracker.Clear();

      foreach (var item in items)
      {
        var read = await repository.Query(true).SingleAsync(value => value.Id == item.Id, cancellationToken);
        Assert.Equal(item.ProviderURL, read.ProviderURL);
        Assert.Equal(item.ProviderLogoURL, read.ProviderLogoURL);
        Assert.Equal(country.Id, read.ProviderCountryId);
        Assert.Equal(country.Name, read.ProviderCountry);
      }

      // Global text and provider-only search both find the name, without widening the caller's query.
      var globalMatches = await repository.Contains(repository.Query(false), "SEARCH-ONLY")
        .Select(item => item.Id)
        .ToListAsync(cancellationToken);
      Assert.Equal(items.Select(item => item.Id).Order(), globalMatches.Order());
      var providerMatches = await repository.Contains(repository.Query(false), item => item.Provider, "SEARCH-ONLY")
        .Select(item => item.Id)
        .ToListAsync(cancellationToken);
      Assert.Equal(globalMatches.Order(), providerMatches.Order());
      var restrictedMatches = await repository.Contains(repository.Query(false).Where(item => item.Id == items[0].Id), "SEARCH-ONLY")
        .Select(item => item.Id)
        .ToListAsync(cancellationToken);
      Assert.Equal(items[0].Id, Assert.Single(restrictedMatches));

      // Check index eligibility, not production latency: small fixtures normally favour a sequential scan.
      await using (var transaction = await context.Database.BeginTransactionAsync(cancellationToken))
      {
        await context.Database.ExecuteSqlRawAsync("SET LOCAL enable_seqscan = off;", cancellationToken);
        await using var command = repository.Contains(repository.Query(false), "SEARCH-ONLY")
          .Select(item => item.Id)
          .CreateDbCommand();
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = "EXPLAIN (FORMAT JSON) " + command.CommandText;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        Assert.True(await reader.ReadAsync(cancellationToken));
        Assert.Contains("\"Index Name\": \"IX_Opportunity_Provider\"", reader.GetString(0));
      }

      items[0].ProviderURL = "https://example.com/updated-provider";
      items[0].ProviderLogoURL = "https://example.com/updated-provider-logo.png";
      await repository.Update(items[0]);
      items[1].ProviderURL = null;
      items[1].ProviderLogoURL = null;
      items[1].ProviderCountryId = null;
      await repository.Update([items[1]]);
      context.ChangeTracker.Clear();
      var updated = await repository.Query().SingleAsync(value => value.Id == items[0].Id, cancellationToken);
      Assert.Equal(items[0].ProviderURL, updated.ProviderURL);
      Assert.Equal(items[0].ProviderLogoURL, updated.ProviderLogoURL);
      Assert.Equal(country.Name, updated.ProviderCountry);
      var cleared = await repository.Query().SingleAsync(value => value.Id == items[1].Id, cancellationToken);
      Assert.Null(cleared.ProviderURL);
      Assert.Null(cleared.ProviderLogoURL);
      Assert.Null(cleared.ProviderCountryId);
      Assert.Null(cleared.ProviderCountry);
    }

    private static async Task AssertCompletionLocationRepositoryRoundTrip(ApplicationDbContext context, CancellationToken cancellationToken)
    {
      var country = await context.Country.FirstAsync(item => item.CodeAlpha2 == "ZA", cancellationToken);
      var opportunityId = await context.Opportunity.Select(item => item.Id).FirstAsync(cancellationToken);
      var actionId = await context.MyOpportunityAction.Where(item => item.Name == "Verification")
        .Select(item => item.Id).SingleAsync(cancellationToken);
      var pendingId = await context.MyOpportunityVerificationStatus.Where(item => item.Name == "Pending")
        .Select(item => item.Id).SingleAsync(cancellationToken);
      var users = Enumerable.Range(1, 2).Select(index => new Infrastructure.Database.Entity.Entities.User
      {
        Id = Guid.NewGuid(),
        Email = $"location-roundtrip-{index}@example.invalid",
        DisplayName = "Location round-trip",
        DateCreated = DateTimeOffset.UtcNow,
        DateModified = DateTimeOffset.UtcNow
      }).ToList();
      context.User.AddRange(users);
      await context.SaveChangesAsync(cancellationToken);

      var repository = new Infrastructure.Database.MyOpportunity.Repositories.MyOpportunityRepository(context);
      var items = users.Select(user => new Domain.MyOpportunity.Models.MyOpportunity
      {
        Id = Guid.NewGuid(),
        UserId = user.Id,
        OpportunityId = opportunityId,
        ActionId = actionId,
        VerificationStatusId = pendingId,
        CountryId = country.Id,
        Region = "Western Cape",
        City = "Cape Town"
      }).ToList();
      items[0] = await repository.Create(items[0]);
      items[1] = Assert.Single(await repository.Create([items[1]]));

      context.ChangeTracker.Clear();
      foreach (var item in items)
      {
        var read = await repository.Query(true).SingleAsync(result => result.Id == item.Id, cancellationToken);
        Assert.Equal(country.Id, read.CountryId);
        Assert.Equal(country.Name, read.Country);
        Assert.Equal("Cape Town, Western Cape, South Africa", read.Location);
      }

      items[0].Feedback = "An unrelated update preserves the snapshot";
      await repository.Update(items[0]);
      items[1].CountryId = null;
      items[1].Region = null;
      items[1].City = null;
      await repository.Update([items[1]]);
      context.ChangeTracker.Clear();
      var preserved = await repository.Query().SingleAsync(result => result.Id == items[0].Id, cancellationToken);
      Assert.Equal("Cape Town, Western Cape, South Africa", preserved.Location);
      var cleared = await repository.Query().SingleAsync(result => result.Id == items[1].Id, cancellationToken);
      Assert.Null(cleared.Location);
      Assert.Null(cleared.CountryId);
      Assert.Null(cleared.Region);
      Assert.Null(cleared.City);
    }
    #endregion Private Members
  }
}
