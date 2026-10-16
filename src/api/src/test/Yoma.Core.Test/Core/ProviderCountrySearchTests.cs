using Microsoft.EntityFrameworkCore;
using Moq;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.CompilerServices;
using Xunit;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Opportunity.Repositories;

namespace Yoma.Core.Test.Core
{
  public class ProviderCountrySearchTests
  {
    #region Class Variables
    private static readonly Guid CountryId = Guid.NewGuid();
    private static readonly Guid OtherCountryId = Guid.NewGuid();
    private static readonly Guid WorldwideId = Guid.NewGuid();
    private static readonly MethodInfo ApplySelection = typeof(OpportunityService)
      .GetMethod("ApplySearchSelection", BindingFlags.Instance | BindingFlags.NonPublic)!;
    #endregion Class Variables

    #region Tests
    [Fact]
    public void SpecificCountryMatchesAvailabilityOrWorldwideProviderOriginOnly()
    {
      var available = new Opportunity { Id = Guid.NewGuid() };
      var worldwideProvider = new Opportunity { Id = Guid.NewGuid(), ProviderCountryId = CountryId };
      var unavailableProvider = new Opportunity { Id = Guid.NewGuid(), ProviderCountryId = CountryId };
      var otherProvider = new Opportunity { Id = Guid.NewGuid(), ProviderCountryId = OtherCountryId };
      var locations = new List<OpportunityCountry>
      {
        new() { OpportunityId = available.Id, CountryId = CountryId },
        new() { OpportunityId = worldwideProvider.Id, CountryId = WorldwideId },
        new() { OpportunityId = unavailableProvider.Id, CountryId = OtherCountryId },
        new() { OpportunityId = otherProvider.Id, CountryId = WorldwideId }
      };
      var repository = Repository(locations);
      var service = Service(repository.Object);
      var query = new[] { available, worldwideProvider, unavailableProvider, otherProvider }.AsQueryable();
      var result = Apply(service, query, new() { Countries = [new() { CountryId = CountryId }] });
      Assert.Equal(new[] { available.Id, worldwideProvider.Id }.Order(), result.Select(item => item.Id).Order());

      // The shared selection must never widen restrictions applied by the outer search query.
      Assert.Empty(Apply(service, query.Where(item => item.Id == unavailableProvider.Id),
        new() { Countries = [new() { CountryId = CountryId }] }));
    }

    [Theory]
    [InlineData("Worldwide")]
    [InlineData("Mixed")]
    [InlineData("Region")]
    [InlineData("City")]
    [InlineData("Radius")]
    public void ProviderOriginDoesNotOverrideWorldwideOrDetailedLocationSelections(string scenario)
    {
      var opportunity = new Opportunity { Id = Guid.NewGuid(), ProviderCountryId = CountryId };
      var repository = Repository([new() { OpportunityId = opportunity.Id, CountryId = WorldwideId }]);
      var country = new OpportunitySearchFilterCountry { CountryId = CountryId };
      var selection = new OpportunitySearchSelection { Countries = [country] };
      switch (scenario)
      {
        case "Worldwide":
          country.CountryId = WorldwideId;
          break;
        case "Mixed":
          selection.Countries.Add(new() { CountryId = WorldwideId });
          break;
        case "Region":
          country.Region = new() { Value = "Gauteng" };
          break;
        case "City":
          country.City = new() { Value = "Pretoria" };
          break;
        case "Radius":
          country.Radius = new() { Value = new() { Coordinates = [28.2, -25.7], RadiusKm = 10 } };
          break;
        default:
          throw new NotSupportedException($"Search test scenario '{scenario}' is not supported.");
      }

      var result = Apply(Service(repository.Object), new[] { opportunity }.AsQueryable(), selection);
      if (scenario is "Worldwide" or "Mixed") Assert.Single(result);
      else Assert.Empty(result);
    }

    [Fact]
    public void ProviderOriginPredicateTranslatesToPostgreSqlWithoutClientFiltering()
    {
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=unused_model_test", options => options.UseNetTopologySuite()).Options);
      var repository = new OpportunityRepository(context);
      var query = Apply(Service(new OpportunityCountryRepository(context)), repository.Query(false),
        new() { Countries = [new() { CountryId = CountryId }] });
      var sql = query.Select(item => item.Id).ToQueryString();
      Assert.Contains("ProviderCountryId", sql);
      Assert.Contains("\"Opportunity\".\"OpportunityCountries\"", sql);
      Assert.Contains(" OR ", sql);
    }

    [Fact]
    public void GlobalTextSearchIncludesProviderAlongsideExistingTargets()
    {
      using var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=unused_model_test", options => options.UseNetTopologySuite()).Options);
      var repository = new OpportunityRepository(context);
      var query = repository.Contains(repository.Query(false).Where(item => item.Id == CountryId), "publisher");
      var sql = query.Select(item => item.Id).ToQueryString();

      Assert.Contains("\"Title\" ILIKE", sql);
      Assert.Contains("\"Summary\" ILIKE", sql);
      Assert.Contains("\"Keywords\" ILIKE", sql);
      Assert.Contains("\"Provider\" ILIKE", sql);
      Assert.Contains("to_tsvector('english',", sql);
      Assert.Contains(" AND ", sql);
    }
    #endregion Tests

    #region Private Members
    private static Mock<IRepositoryPropertyContainsWithSpatial<OpportunityCountry>> Repository(List<OpportunityCountry> locations)
    {
      var repository = new Mock<IRepositoryPropertyContainsWithSpatial<OpportunityCountry>>();
      repository.Setup(value => value.Query()).Returns(locations.AsQueryable());
      repository.Setup(value => value.Contains(It.IsAny<Expression<Func<OpportunityCountry, string?>>>(), It.IsAny<string>()))
        .Returns((Expression<Func<OpportunityCountry, string?>> property, string text) =>
          item => property.Compile()(item) != null && property.Compile()(item)!.Contains(text));
      repository.Setup(value => value.WithinRadius(It.IsAny<IQueryable<OpportunityCountry>>(), It.IsAny<double[]>(), It.IsAny<double>()))
        .Returns((IQueryable<OpportunityCountry> query, double[] _, double _) => query.Where(item => false));
      return repository;
    }

    private static OpportunityService Service(IRepositoryPropertyContainsWithSpatial<OpportunityCountry> repository)
    {
      // Exercise the production shared selector with only its country dependencies; no API/provider calls.
      var service = (OpportunityService)RuntimeHelpers.GetUninitializedObject(typeof(OpportunityService));
      var countries = new Mock<ICountryService>();
      countries.Setup(value => value.GetByCodeAlpha2("WW"))
        .Returns(new Domain.Lookups.Models.Country { Id = WorldwideId, CodeAlpha2 = "WW" });
      typeof(OpportunityService).GetField("_countryService", BindingFlags.Instance | BindingFlags.NonPublic)!
        .SetValue(service, countries.Object);
      typeof(OpportunityService).GetField("_opportunityCountryRepository", BindingFlags.Instance | BindingFlags.NonPublic)!
        .SetValue(service, repository);
      var opportunities = new Mock<IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilter<Opportunity>>();
      opportunities.Setup(value => value.WhereCustomFields(It.IsAny<IQueryable<Opportunity>>(),
          It.IsAny<List<Domain.Core.Models.CustomFieldFilter>?>()))
        .Returns((IQueryable<Opportunity> query, List<Domain.Core.Models.CustomFieldFilter>? _) => query);
      typeof(OpportunityService).GetField("_opportunityRepository", BindingFlags.Instance | BindingFlags.NonPublic)!
        .SetValue(service, opportunities.Object);
      return service;
    }

    private static IQueryable<Opportunity> Apply(OpportunityService service, IQueryable<Opportunity> query,
      OpportunitySearchSelection selection) => (IQueryable<Opportunity>)ApplySelection.Invoke(service, [query, selection])!;
    #endregion Private Members
  }
}
