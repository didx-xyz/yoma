using Moq;
using Xunit;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Validators;

namespace Yoma.Core.Test.Core
{
  public class OpportunityLocationTests
  {
    private static readonly Guid CountryId = Guid.NewGuid();
    private static readonly double[] CapeTownCoordinates = [18.4231, -33.9221];

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
      var validator = new OpportunitySearchFilterValidator(new OpportunitySearchSelectionValidator(
        new Domain.Core.Validators.CoordinatesValidator(), Mock.Of<ICountryService>(),
        Mock.Of<IAccessibilityService>(), new Domain.Core.Validators.CustomFieldFilterValidator()));
      var country = new OpportunitySearchFilterCountry { CountryId = CountryId, City = new() { Value = "Cape Town" } };
      var filter = new OpportunitySearchFilterAdmin { PageNumber = 1, PageSize = 10, Countries = [country] };
      Assert.True(validator.Validate(filter).IsValid);
      country.Region = new() { Value = "Western Cape" };
      Assert.True(validator.Validate(filter).IsValid);
      country.Region = null;
      filter.Countries.Add(new OpportunitySearchFilterCountry { CountryId = Guid.NewGuid() });
      Assert.True(validator.Validate(filter).IsValid);
      filter.Countries.Add(new OpportunitySearchFilterCountry { CountryId = CountryId });
      Assert.False(validator.Validate(filter).IsValid);
      filter.Countries.RemoveAt(2);
      country.Radius = new() { Value = new() { RadiusKm = 25 } };
      Assert.False(validator.Validate(filter).IsValid);
      country.Radius.Value!.Coordinates = [18.4231, -33.9221];
      Assert.False(validator.Validate(filter).IsValid);
      country.City = null;
      Assert.True(validator.Validate(filter).IsValid);
      country.Region = new() { Value = "Western Cape" };
      Assert.False(validator.Validate(filter).IsValid);
      country.Region = null;
      country.Radius!.Value!.RadiusKm = double.NaN;
      Assert.False(validator.Validate(filter).IsValid);
      country.Radius!.Value!.RadiusKm = 25;
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
      var validator = new OpportunitySearchFilterValidator(new OpportunitySearchSelectionValidator(
        new Domain.Core.Validators.CoordinatesValidator(), Mock.Of<ICountryService>(),
        Mock.Of<IAccessibilityService>(), new Domain.Core.Validators.CustomFieldFilterValidator()));

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

  }
}
