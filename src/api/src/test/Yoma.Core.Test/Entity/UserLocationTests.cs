using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Xunit;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Validators;
using Yoma.Core.Domain.Entity.Extensions;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Entity.Repositories;

namespace Yoma.Core.Test.Entity
{
  public class UserLocationTests
  {
    [Fact]
    public void LocationAcceptsCityCentreAndTrimsNamesWithoutChangingLanguage()
    {
      var location = JsonConvert.DeserializeObject<UserRequestUpdateLocation>(
        "{\"city\":\"  Cape Town  \",\"region\":\" Western Cape \",\"coordinates\":[18.4231,-33.9221]}",
        new Domain.Core.Converters.StringTrimmingConverter())!;

      Assert.True(Validator().Validate(location).IsValid);
      Assert.Equal("Cape Town", location.City);
      Assert.Equal("Western Cape", location.Region);
      var empty = JsonConvert.DeserializeObject<UserRequestUpdateLocation>(
        "{\"city\":\"   \",\"region\":\"\"}", new Domain.Core.Converters.StringTrimmingConverter())!;
      Assert.Null(empty.City);
      Assert.Null(empty.Region);
      location.LocationSource = LocationSource.Device;
      Assert.True(Validator().Validate(location).IsValid);
    }

    [Theory]
    [InlineData(91, 18)]
    [InlineData(-91, 18)]
    [InlineData(-33, 181)]
    [InlineData(-33, -181)]
    [InlineData(double.NaN, 18)]
    [InlineData(-33, double.PositiveInfinity)]
    public void InvalidCoordinatesAreRejected(double latitude, double longitude)
    {
      var location = City();
      location.Coordinates = [longitude, latitude];
      Assert.False(Validator().Validate(location).IsValid);
    }

    [Fact]
    public void RegionOnlyAndManualLocationsDoNotRequireCoordinates()
    {
      var location = new UserRequestUpdateLocation { Region = "Gauteng", LocationSource = LocationSource.Lookup };
      Assert.True(Validator().Validate(location).IsValid);
      location.Coordinates = City().Coordinates;
      Assert.False(Validator().Validate(location).IsValid);

      location = City();
      location.LocationSource = LocationSource.Manual;
      Assert.False(Validator().Validate(location).IsValid);
      location.Coordinates = null;
      Assert.True(Validator().Validate(location).IsValid);
    }

    [Fact]
    public void EmptyLocationIsAllowedButOrphanedMetadataIsRejected()
    {
      var validator = Validator();
      Assert.True(validator.Validate(new UserRequestUpdateLocation()).IsValid);
      Assert.False(validator.Validate(new UserRequestUpdateLocation { LocationSource = LocationSource.Lookup }).IsValid);
      Assert.True(validator.Validate(new UserRequestUpdateLocation { City = "Cape Town" }).IsValid);
    }

    [Fact]
    public void CoordinatesRequireBothValuesAndSourceUsesProviderNeutralEnumNames()
    {
      var location = City();
      location.Coordinates = [];
      Assert.False(Validator().Validate(location).IsValid);
      location.Coordinates = [0];
      Assert.False(Validator().Validate(location).IsValid);
      location.Coordinates = [0, 0, 0];
      Assert.False(Validator().Validate(location).IsValid);
      location.Coordinates = [0, 0];
      Assert.True(Validator().Validate(location).IsValid);
      var json = JsonConvert.SerializeObject(City(), new StringEnumConverter());
      Assert.Contains("\"Lookup\"", json);
      Assert.DoesNotContain("PlaceId", json);
      var roundTrip = JsonConvert.DeserializeObject<UserRequestUpdateLocation>(json, new StringEnumConverter());
      Assert.Equal(LocationSource.Lookup, roundTrip!.LocationSource);
      Assert.Equal(new[] { 18.4231, -33.9221 }, roundTrip.Coordinates);
    }

    [Fact]
    public void ProfileFlattensLocationAlongsideTheExistingCountry()
    {
      var user = new User { CountryId = Guid.NewGuid() };
      var location = City();
      user.Region = location.Region;
      user.City = location.City;
      user.Coordinates = location.Coordinates;
      user.LocationSource = location.LocationSource;
      var profile = user.ToProfile();
      Assert.Equal(user.CountryId, profile.CountryId);
      Assert.Equal("Cape Town", profile.City);
      Assert.Equal(user.Coordinates, profile.Coordinates);
      Assert.Null(typeof(UserProfile).GetProperty("Location"));
      Assert.Null(typeof(UserRequest).GetProperty("Region"));
    }

    [Fact]
    public void UserProjectionWithSpatialCoordinatesTranslatesWithoutLoadingChildren()
    {
      var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseNpgsql("Host=localhost;Database=location_projection;Username=test;Password=test", options => options.UseNetTopologySuite()).Options;
      using var context = new ApplicationDbContext(options);
      var query = new UserRepository(context).Query(false).Where(user => user.Id == Guid.Empty).ToQueryString();
      Assert.Contains("Coordinates", query);
      Assert.DoesNotContain("UserSkills", query);
    }

    private static UserRequestUpdateLocation City() => new()
    {
      Region = "Western Cape",
      City = "Cape Town",
      Coordinates = [18.4231, -33.9221],
      LocationSource = LocationSource.Lookup
    };

    private static UserRequestUpdateLocationValidator Validator() => new(Mock.Of<ICountryService>());

    [Fact]
    public void DedicatedLocationRequiresExistingNonWorldwideCountry()
    {
      var countryId = Guid.NewGuid();
      var worldwideId = Guid.NewGuid();
      var countries = new Mock<ICountryService>();
      var country = new Domain.Lookups.Models.Country { Id = countryId, Name = "South Africa" };
      var worldwide = new Domain.Lookups.Models.Country { Id = worldwideId, Name = "Worldwide" };
      countries.Setup(x => x.GetByIdOrNull(countryId)).Returns(country);
      countries.Setup(x => x.GetByIdOrNull(worldwideId)).Returns(worldwide);
      countries.Setup(x => x.GetByCodeAlpha2(It.IsAny<string>())).Returns(worldwide);
      var validator = new UserRequestUpdateLocationValidator(countries.Object);
      var request = new UserRequestUpdateLocation();
      Assert.False(validator.Validate(request, o => o.IncludeAllRuleSets()).IsValid);
      request.CountryId = Guid.NewGuid();
      Assert.False(validator.Validate(request, o => o.IncludeAllRuleSets()).IsValid);
      request.CountryId = worldwideId;
      Assert.False(validator.Validate(request, o => o.IncludeAllRuleSets()).IsValid);
      request.CountryId = countryId;
      Assert.True(validator.Validate(request, o => o.IncludeAllRuleSets()).IsValid);
      request.Coordinates = [181, 0];
      Assert.False(validator.Validate(request, o => o.IncludeAllRuleSets()).IsValid);
    }

    [Fact]
    public void ProfileUpdateRequiresCountryEvenWithoutLocationDetails()
    {
      var countries = new Mock<ICountryService>();
      var countryId = Guid.NewGuid();
      countries.Setup(x => x.GetByIdOrNull(countryId))
        .Returns(new Domain.Lookups.Models.Country { Id = countryId, Name = "South Africa" });
      countries.Setup(x => x.GetByCodeAlpha2(It.IsAny<string>()))
        .Returns(new Domain.Lookups.Models.Country { Id = Guid.NewGuid(), Name = "Worldwide" });
      var validator = new UserRequestUpdateProfileValidator(countries.Object,
        Mock.Of<IEducationService>(), Mock.Of<IGenderService>(),
        new UserRequestUpdateLocationValidator(countries.Object));
      var request = new UserRequestUpdateProfile { FirstName = "Test", Surname = "User" };
      Assert.Contains(validator.Validate(request).Errors, x => x.PropertyName == nameof(request.CountryId));
      request.CountryId = Guid.Empty;
      Assert.False(validator.Validate(request).IsValid);
      request.CountryId = Guid.NewGuid();
      Assert.False(validator.Validate(request).IsValid);
      request.CountryId = countryId;
      Assert.True(validator.Validate(request, o => o.IncludeProperties(x => x.CountryId)).IsValid);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void ProfileValidatorsRequireGenderAndBirthDateButInternalUpsertDoesNot(bool create)
    {
      var countries = Mock.Of<ICountryService>();
      var education = Mock.Of<IEducationService>();
      var genders = new Mock<IGenderService>();
      var genderId = Guid.NewGuid();
      genders.Setup(x => x.GetByIdOrNull(genderId))
        .Returns(new Domain.Lookups.Models.Gender { Id = genderId, Name = "Other" });
      var location = new UserRequestUpdateLocationValidator(countries);
      IValidator validator = create
        ? new UserRequestCreateProfileValidator(countries, education, genders.Object, location)
        : new UserRequestUpdateProfileValidator(countries, education, genders.Object, location);
      UserRequestBase request = create ? new UserRequestCreateProfile() : new UserRequestUpdateProfile();
      bool IsValid() => !validator.Validate(new ValidationContext<UserRequestBase>(request)).Errors
        .Any(x => x.PropertyName == nameof(request.GenderId) || x.PropertyName == nameof(request.DateOfBirth));
      Assert.False(IsValid());
      request.GenderId = genderId;
      Assert.False(IsValid());
      request.DateOfBirth = new DateTimeOffset(1899, 12, 31, 0, 0, 0, TimeSpan.Zero);
      Assert.False(IsValid());
      request.DateOfBirth = new DateTimeOffset(1900, 1, 1, 0, 0, 0, TimeSpan.Zero);
      Assert.True(IsValid());
      request.DateOfBirth = DateTimeOffset.UtcNow.AddDays(1);
      Assert.False(IsValid());
      request.DateOfBirth = DateTimeOffset.UtcNow.Date;
      Assert.True(IsValid());
      var internalValidator = new UserRequestValidator(countries, education, genders.Object);
      Assert.True(internalValidator.Validate(new UserRequest { Username = "test@example.com" }).IsValid);
    }
  }
}
