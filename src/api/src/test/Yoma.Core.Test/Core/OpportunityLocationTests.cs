using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.Database.Migrations;
using Moq;
using Xunit;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;

namespace Yoma.Core.Test.Core
{
  public class OpportunityLocationTests
  {
    private static readonly Guid CountryId = Guid.NewGuid();
    private static readonly double[] CapeTownCoordinates = [18.4231, -33.9221];

    [Fact]
    public async Task SpatialFilterExecutesAndUsesIndex()
    {
      var connectionString = Environment.GetEnvironmentVariable("YOMA_LOCATION_TEST_CONNECTION");
      Assert.SkipWhen(string.IsNullOrEmpty(connectionString), "Set YOMA_LOCATION_TEST_CONNECTION to an empty disposable PostGIS database.");
      var builder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
      Assert.StartsWith("yoma_location_tests", builder.Database);
      Assert.True(builder.Host is "localhost" or "127.0.0.1");
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql(connectionString, options => options.UseNetTopologySuite()).Options);
      var cancellationToken = TestContext.Current.CancellationToken;
      await context.Database.EnsureCreatedAsync(cancellationToken);
      await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
      // Isolated fixture: unrelated opportunity/country foreign keys do not participate in this query.
      await context.Database.ExecuteSqlRawAsync("SET LOCAL session_replication_role = replica", cancellationToken);
      await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "Opportunity"."OpportunityCountries" ("Id", "OpportunityId", "CountryId", "Region", "City", "Coordinates", "DateCreated", "DateModified")
        SELECT gen_random_uuid(), gen_random_uuid(), {CountryId}, 'Gauteng', 'Johannesburg',
          ST_SetSRID(ST_MakePoint(28 + (i % 100) * 0.001, -26), 4326)::geography, now(), now()
        FROM generate_series(1, 50000) i;
        INSERT INTO "Opportunity"."OpportunityCountries" ("Id", "OpportunityId", "CountryId", "Region", "City", "Coordinates", "DateCreated", "DateModified")
        VALUES (gen_random_uuid(), gen_random_uuid(), {CountryId}, 'Western Cape', 'Cape Town', ST_SetSRID(ST_MakePoint(18.4231, -33.9221), 4326)::geography, now(), now()),
          (gen_random_uuid(), gen_random_uuid(), {CountryId}, NULL, NULL, NULL, now(), now());
        """, cancellationToken);
      await context.Database.ExecuteSqlRawAsync("ANALYZE \"Opportunity\".\"OpportunityCountries\"", cancellationToken);
      var repository = new OpportunityCountryRepository(context);
      var source = context.OpportunityCountries.Select(o => new OpportunityCountry
      {
        Id = o.Id,
        CountryId = o.CountryId,
        Region = o.Region,
        City = o.City
      });
      source = source.Where(o => o.CountryId == CountryId);
      var query = repository.WithinRadius(source, CapeTownCoordinates, 25).Select(o => o.Id);
      Assert.Single(await query.ToListAsync(cancellationToken));
      await using (var command = query.CreateDbCommand())
      {
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = "EXPLAIN (ANALYZE, FORMAT TEXT) " + command.CommandText;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var plan = new List<string>();
        while (await reader.ReadAsync(cancellationToken)) plan.Add(reader.GetString(0));
        Assert.Contains("IX_OpportunityCountries_Coordinates", string.Join("\n", plan));
      }
      var textQuery = source.Where(repository.Contains(o => o.City, "cape").Or(o => o.City == null));
      Assert.Equal(2, await textQuery.CountAsync(cancellationToken));
      Assert.Single(await repository.Contains(source, o => o.City, "cape").ToListAsync(cancellationToken));
      Assert.Equal(50000, await repository.Contains(source, o => o.Region, "gauteng").CountAsync(cancellationToken));
      Assert.Single(await repository.Contains(source, o => o.City, "cape%").ToListAsync(cancellationToken));
      Assert.Empty(await repository.Contains(source.Where(o => o.CountryId != CountryId), o => o.City, "cape").ToListAsync(cancellationToken));

      // Verify geography projection back to the unchanged API array, not only filtering SQL.
      var projected = await context.OpportunityCountries.Where(o => o.City == "Cape Town")
        .Select(o => Infrastructure.Database.Core.Helpers.CoordinatesHelper.ToArray(o.Coordinates)).SingleAsync(cancellationToken);
      Assert.Equal(CapeTownCoordinates, projected);
      var userRepository = new Infrastructure.Database.Entity.Repositories.UserRepository(context);
      var user = await userRepository.Create(new Domain.Entity.Models.User
      {
        Email = "location-test@example.invalid",
        Coordinates = [18.4231, -33.9221],
        Region = "Western Cape",
        City = "Cape Town"
      });
      var storedUser = await userRepository.Query(false).SingleAsync(o => o.Id == user.Id, cancellationToken);
      Assert.Equal(user.Coordinates, storedUser.Coordinates);
      storedUser.Coordinates = null;
      await userRepository.Update(storedUser);
      Assert.Null((await userRepository.Query(false).SingleAsync(o => o.Id == user.Id, cancellationToken)).Coordinates);

      var otherCountryId = Guid.NewGuid();
      var crossCountryOpportunityId = Guid.NewGuid();
      var otherMatchId = Guid.NewGuid();
      await context.Database.ExecuteSqlInterpolatedAsync($"""
        INSERT INTO "Opportunity"."OpportunityCountries" ("Id", "OpportunityId", "CountryId", "City", "DateCreated", "DateModified")
        VALUES (gen_random_uuid(), {crossCountryOpportunityId}, {CountryId}, 'Johannesburg', now(), now()),
          (gen_random_uuid(), {crossCountryOpportunityId}, {otherCountryId}, 'Cape Town', now(), now()),
          (gen_random_uuid(), {otherMatchId}, {otherCountryId}, 'Gaborone', now(), now());
        """, cancellationToken);
      var allLocations = context.OpportunityCountries.Select(o => new OpportunityCountry
      {
        Id = o.Id,
        OpportunityId = o.OpportunityId,
        CountryId = o.CountryId,
        City = o.City
      });
      var firstCountry = allLocations.Where(o => o.CountryId == CountryId)
        .Where(repository.Contains(o => o.City, "Cape").Or(o => o.City == null));
      var secondCountry = allLocations.Where(o => o.CountryId == otherCountryId)
        .Where(repository.Contains(o => o.City, "Gaborone").Or(o => o.City == null));
      var predicate = PredicateBuilder.False<Opportunity>()
        .Or(o => firstCountry.Any(c => c.OpportunityId == o.Id))
        .Or(o => secondCountry.Any(c => c.OpportunityId == o.Id));
      var matchingOpportunities = await allLocations.Select(o => new Opportunity { Id = o.OpportunityId })
        .Where(predicate).Select(o => o.Id).Distinct().ToListAsync(cancellationToken);
      Assert.Equal(3, matchingOpportunities.Count); // Cape Town, unspecified in the first country, Gaborone in the second.
      Assert.Contains(otherMatchId, matchingOpportunities);
      Assert.DoesNotContain(crossCountryOpportunityId, matchingOpportunities);
      await transaction.RollbackAsync(cancellationToken);
    }

    [Fact]
    public void RadiusAndTextQueriesTranslateToPostgreSqlBeforePagination()
    {
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=translation_only;Username=unused;Password=unused", options => options.UseNetTopologySuite()).Options);
      var repository = new OpportunityCountryRepository(context);
      var countries = repository.Query();
      countries = countries.Where(o => o.CountryId == CountryId);
      var matching = repository.WithinRadius(countries, CapeTownCoordinates, 25);
      var sql = context.Opportunity.Where(o => matching.Any(c => c.OpportunityId == o.Id))
        .OrderBy(o => o.Id).Take(10).ToQueryString();
      Assert.Contains("ST_DWithin", sql);
      Assert.DoesNotContain("ST_Distance(", sql);
      Assert.Contains("EXISTS", sql);
      Assert.Contains("LIMIT", sql);
      var textQuery = countries.Where(repository.Contains(o => o.City, "Cape").Or(o => o.City == null));
      Assert.Contains("ILIKE", textQuery.ToQueryString());
      Assert.Contains("IS NULL", textQuery.ToQueryString());
      Assert.DoesNotContain("ST_DWithin", textQuery.ToQueryString());
    }

    [Fact]
    public void LocationValidatorAllowsOptionalDetailsAndRejectsWorldwideDetails()
    {
      var countries = new Mock<ICountryService>();
      countries.Setup(o => o.GetByIdOrNull(CountryId)).Returns(new Country { Id = CountryId, CodeAlpha2 = "ZA" });
      var worldwide = Guid.NewGuid();
      countries.Setup(o => o.GetByIdOrNull(worldwide)).Returns(new Country { Id = worldwide, CodeAlpha2 = "WW" });
      var validator = new OpportunityRequestCountryValidator(countries.Object, new Domain.Core.Validators.CoordinatesValidator());
      Assert.True(validator.Validate(new OpportunityRequestCountry { CountryId = CountryId }).IsValid);
      Assert.True(validator.Validate(new OpportunityRequestCountry { CountryId = CountryId, Region = "Western Cape" }).IsValid);
      Assert.False(validator.Validate(new OpportunityRequestCountry { CountryId = worldwide, City = "Cape Town" }).IsValid);
      Assert.False(validator.Validate(new OpportunityRequestCountry { CountryId = CountryId, Coordinates = [181, 0] }).IsValid);
      Assert.False(validator.Validate(new OpportunityRequestCountry { CountryId = CountryId, Coordinates = [0] }).IsValid);
    }

    [Fact]
    public void SearchValidatorAllowsIndependentCountriesAndRequiresPairedRadiusCoordinatesPerEntry()
    {
      var validator = new OpportunitySearchFilterValidator(
        new Domain.Core.Validators.CoordinatesValidator(), Mock.Of<IAccessibilityService>());
      var country = new OpportunitySearchFilterCountry { CountryId = CountryId, City = "Cape Town" };
      var filter = new OpportunitySearchFilterAdmin { PageNumber = 1, PageSize = 10, Countries = [country] };
      Assert.True(validator.Validate(filter).IsValid);
      country.Region = "Western Cape";
      Assert.True(validator.Validate(filter).IsValid);
      country.Region = null;
      filter.Countries.Add(new OpportunitySearchFilterCountry { CountryId = Guid.NewGuid() });
      Assert.True(validator.Validate(filter).IsValid);
      filter.Countries.Add(new OpportunitySearchFilterCountry { CountryId = CountryId });
      Assert.False(validator.Validate(filter).IsValid);
      filter.Countries.RemoveAt(2);
      country.RadiusKm = 25;
      Assert.False(validator.Validate(filter).IsValid);
      country.Coordinates = [18.4231, -33.9221];
      Assert.False(validator.Validate(filter).IsValid);
      country.City = null;
      Assert.True(validator.Validate(filter).IsValid);
      country.Region = "Western Cape";
      Assert.False(validator.Validate(filter).IsValid);
      country.Region = null;
      country.RadiusKm = double.NaN;
      Assert.False(validator.Validate(filter).IsValid);
      country.RadiusKm = 25;
      filter.Countries[1].CountryId = Guid.Empty;
      Assert.False(validator.Validate(filter).IsValid);
    }

    [Fact]
    public void SyncUpdateConversionPreservesLocationPayloadAndCopiesCoordinates()
    {
      var request = new OpportunityRequestCreate
      {
        Categories = [],
        Languages = [],
        Countries = [new OpportunityRequestCountry { CountryId = CountryId, City = "Cape Town", Coordinates = [18.4231, -33.9221] }]
      };
      // Hash normalization is deterministic without deduplicating conflicting country entries.
      request.NormalizeForHashing();
      var country = Assert.Single(request.Countries);
      Assert.Equal("Cape Town", country.City);
      var update = request.ToRequestUpdate(Guid.NewGuid());
      var countryUpdated = Assert.Single(update.Countries!);
      Assert.Equal(country.Coordinates, countryUpdated.Coordinates);
      Assert.NotSame(country.Coordinates, countryUpdated.Coordinates);
    }

    [Fact]
    public void CountryHashNormalizationPreservesInvalidEntriesForValidation()
    {
      var filter = new OpportunitySearchFilterAdmin
      {
        PageNumber = 1,
        PageSize = 10,
        Countries = [new OpportunitySearchFilterCountry { CountryId = CountryId }, null!]
      };
      filter.NormalizeForHashing();
      Assert.Equal(2, filter.Countries!.Count);
      var validator = new OpportunitySearchFilterValidator(
        new Domain.Core.Validators.CoordinatesValidator(), Mock.Of<IAccessibilityService>());

      Assert.False(validator.Validate(filter).IsValid);

      var request = new OpportunityRequestCreate
      {
        Categories = [],
        Languages = [],
        Countries = [new OpportunityRequestCountry { CountryId = CountryId }, null!]
      };
      request.NormalizeForHashing();
      Assert.Equal(2, request.Countries.Count);
      Assert.Contains(request.Countries, entry => entry == null);
    }

    [Fact]
    public void SpatialModelMatchesMigrationSnapshot()
    {
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=translation_only;Username=unused;Password=unused", options => options.UseNetTopologySuite()).Options);
      var snapshot = context.GetService<IModelRuntimeInitializer>().Initialize(context.GetService<IMigrationsAssembly>().ModelSnapshot!.Model, designTime: true);
      var changes = context.GetService<IMigrationsModelDiffer>().GetDifferences(
        snapshot.GetRelationalModel(), context.GetService<IDesignTimeModel>().Model.GetRelationalModel());
      Assert.Empty(changes);
    }
  }
}
