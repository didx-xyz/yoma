using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserRequestCreateProfileValidator : UserRequestValidatorBase<UserRequestCreateProfile>
  {
    #region Class Variables
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public UserRequestCreateProfileValidator(ICountryService countryService, IEducationService educationService,
        IGenderService genderService) : base(educationService, genderService)
    {
      _countryService = countryService;

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

      RuleFor(x => x.PhoneNumber).Must(PhoneNumberValidator.IsValidPhoneNumber).When(x => !string.IsNullOrEmpty(x.PhoneNumber))
        .WithMessage("'Phone Number' must be a valid phone number in international format (e.g. +27831234567).");

      RuleFor(x => new { x.PhoneNumber, x.Email })
        .Must(x => !string.IsNullOrWhiteSpace(x.PhoneNumber) || !string.IsNullOrWhiteSpace(x.Email))
        .WithMessage("Either 'Phone Number' or 'Email' is required.");

      RuleFor(x => x.CountryCodeAlpha2)
        .NotEmpty().WithMessage("'Country' is required.")
        .DependentRules(() =>
        {
          RuleFor(x => x.CountryCodeAlpha2)
          .Must(CountryExists)
          .WithMessage("Specified 'Country' is invalid or not allowed (e.g., 'Worldwide' is not permitted).");
        });
    }
    #endregion

    #region Private Members
    private bool CountryExists(string? codeAlpha2)
    {
      codeAlpha2 = codeAlpha2?.Trim();
      if (string.IsNullOrEmpty(codeAlpha2)) return true; 

      var country = _countryService.GetByCodeAplha2OrNull(codeAlpha2);
      if (country == null) return false;

      var countryIdWorldwide = _countryService.GetByCodeAplha2(Country.Worldwide.ToDescription());
      return country.Id != countryIdWorldwide.Id;
    }
    #endregion
  }
}
