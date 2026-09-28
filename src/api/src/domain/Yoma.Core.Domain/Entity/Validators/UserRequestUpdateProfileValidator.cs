using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserRequestUpdateProfileValidator : UserRequestValidatorBase<UserRequestUpdateProfile>
  {
    #region Class Variables
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public UserRequestUpdateProfileValidator(ICountryService countryService, IEducationService educationService,
        IGenderService genderService, UserRequestUpdateLocationValidator locationValidator) : base(educationService, genderService)
    {
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      ArgumentNullException.ThrowIfNull(locationValidator);
      RuleFor(x => new UserRequestUpdateLocation
      {
        Region = x.Region,
        City = x.City,
        Coordinates = x.Coordinates,
        LocationSource = x.LocationSource
      }).SetValidator(locationValidator);

      RuleFor(x => x.GenderId).NotEmpty().WithMessage("'Gender' is required.");
      RuleFor(x => x.DateOfBirth).NotNull().WithMessage("'Date of Birth' is required.")
        .DependentRules(() =>
        {
          RuleFor(x => x.DateOfBirth).Must(date => date!.Value.Date >= new DateTime(1900, 1, 1))
            .WithMessage("'Date of Birth' must be on or after 1 January 1900.");
        });

      RuleFor(x => x.FirstName).NotEmpty().WithMessage("'First Name' is required.")
        .DependentRules(() =>
        {
          RuleFor(x => x.FirstName).Length(1, 125).WithMessage("'First Name' must be between 1 and 125 characters.");
        });

      RuleFor(x => x.Surname)
        .NotEmpty().WithMessage("'{PropertyName}' is required.")
        .DependentRules(() =>
        {
          RuleFor(x => x.Surname).Length(1, 125).WithMessage("'{PropertyName}' must be between 1 and 125 characters.");
        });

      RuleFor(x => x.CountryId).NotEmpty().WithMessage("'Country' is required.")
        .DependentRules(() =>
        {
          RuleFor(x => x.CountryId).Must(CountryExists)
            .WithMessage("Specified 'Country' is invalid / does not exist. 'Worldwide' is not allowed as a country selection.");
        });
    }
    #endregion

    #region Private Members
    private bool CountryExists(Guid id)
    {
      if (id == Guid.Empty) return false;

      var country = _countryService.GetByIdOrNull(id);
      if (country == null) return false;

      var countryIdWorldwide = _countryService.GetByCodeAlpha2(Country.Worldwide.ToDescription());
      return country.Id != countryIdWorldwide.Id;
    }
    #endregion
  }
}
