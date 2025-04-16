using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserRequestValidator : UserRequestValidatorBase<UserRequest>
  {
    #region Class Variables
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public UserRequestValidator(ICountryService countryService, IEducationService educationService,
        IGenderService genderService) : base(educationService, genderService)
    {
      _countryService = countryService;

      RuleFor(x => x.Id).NotEmpty().When(x => x.Id.HasValue).WithMessage("'{PropertyName}' can not be empty if specified");
      RuleFor(x => x.Username).NotEmpty().WithMessage("'{PropertyName}' is required");
      RuleFor(x => x.FirstName).Length(1, 125).When(x => !string.IsNullOrEmpty(x.FirstName)).WithMessage("'First Name' must be between 1 and 125 characters.");
      RuleFor(x => x.Surname).Length(1, 125).When(x => !string.IsNullOrEmpty(x.Surname)).WithMessage("'{PropertyName}' must be between 1 and 125 characters.");
      RuleFor(x => x.PhoneNumber).Must(PhoneNumberValidator.IsValidPhoneNumber).WithMessage("'Phone Number' must be a valid phone number in international format (e.g. +27831234567).").When(x => !string.IsNullOrEmpty(x.PhoneNumber));
      RuleFor(x => x.CountryId).Must(CountryExists).WithMessage($"Specified 'Country' is invalid / does not exist. 'Worldwide' is not allowed as a country selection.");
      RuleFor(x => x.DateLastLogin).Must(NotInFuture).WithMessage("'Last Login Date' is in the future.");
    }
    #endregion

    #region Private Members
    private bool NotInFuture(DateTimeOffset? date)
    {
      if (!date.HasValue) return true;
      return date <= DateTimeOffset.UtcNow;
    }

    private bool CountryExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;

      var country = _countryService.GetByIdOrNull(id.Value);
      if (country == null) return false;

      var countryIdWorldwide = _countryService.GetByCodeAplha2(Country.Worldwide.ToDescription());
      return country.Id != countryIdWorldwide.Id;
    }
    #endregion
  }
}
