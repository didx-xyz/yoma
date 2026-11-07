using FluentValidation;
using Moq;
using Xunit;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Validators;

namespace Yoma.Core.Test.Referral.Services
{
  public class ProgramRequestValidationTests
  {
    #region Tests
    [Fact]
    public void MissingCountriesAreRejectedBeforePersistence()
    {
      AssertCountries(null, false);
    }

    [Fact]
    public void EmptyCountriesAreRejected()
    {
      AssertCountries([], false);
    }

    [Fact]
    public void InvalidCountryIsRejected()
    {
      AssertCountries([Guid.Empty], false);
      AssertCountries([Guid.NewGuid()], false);
    }

    [Fact]
    public void ExistingCountryAndWorldwideRemainAccepted()
    {
      var country = new Country { Id = Guid.NewGuid(), Name = "South Africa", CodeAlpha2 = "ZA" };
      AssertCountries([country.Id], true, country);
      var worldwide = new Country { Id = Guid.NewGuid(), Name = "Worldwide", CodeAlpha2 = "WW" };
      AssertCountries([worldwide.Id], true, worldwide);
    }
    #endregion

    #region Private Members
    private static void AssertCountries(List<Guid>? ids, bool valid, Country? country = null)
    {
      var countries = new Mock<ICountryService>();
      if (country != null)
        countries.Setup(service => service.GetByIdOrNull(country.Id)).Returns(country);

      var create = new ProgramRequestValidatorCreate(countries.Object);
      var update = new ProgramRequestValidatorUpdate(countries.Object);
      var createResult = create.Validate(new ProgramRequestCreate { Countries = ids },
        options => options.IncludeProperties(request => request.Countries));
      var updateResult = update.Validate(new ProgramRequestUpdate { Countries = ids },
        options => options.IncludeProperties(request => request.Countries));

      Assert.Equal(valid, createResult.IsValid);
      Assert.Equal(valid, updateResult.IsValid);
      if (!valid)
      {
        const string message = "Please select at least one valid country, or Worldwide.";
        Assert.Contains(createResult.Errors, error => error.ErrorMessage == message);
        Assert.Contains(updateResult.Errors, error => error.ErrorMessage == message);
      }
    }
    #endregion
  }
}
