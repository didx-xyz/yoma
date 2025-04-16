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

      RuleFor(x => x.CountryId).Must(CountryExists).WithMessage($"Specified 'Country' is invalid / does not exist. 'Worldwide' is not allowed as a country selection.");
    }
    #endregion

    #region Private Members
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
