using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserRequestValidator : AbstractValidator<UserRequest>
  {
    #region Class Variables
    private ICountryService _countryService;
    private IGenderService _genderService;
    #endregion

    #region Constructor
    public UserRequestValidator(ICountryService countryService,
        IGenderService genderService)
    {
      _countryService = countryService;
      _genderService = genderService;

      RuleFor(x => x.Email).NotEmpty().EmailAddress();
      RuleFor(x => x.FirstName).NotEmpty().Length(1, 320);
      RuleFor(x => x.Surname).NotEmpty().Length(1, 320);
      RuleFor(x => x.PhoneNumber).Length(0, 50).Matches(RegExValidators.PhoneNumber()).WithMessage("'{PropertyName}' is invalid.").When(x => !string.IsNullOrEmpty(x.PhoneNumber));
      RuleFor(x => x.CountryId).Must(CountryExists).WithMessage($"Specified country is invalid / does not exist.");
      RuleFor(x => x.CountryOfResidenceId).Must(CountryExists).WithMessage($"Specified country of residence is invalid / does not exist.");
      RuleFor(x => x.GenderId).Must(GenderExists).WithMessage($"Specified gender is invalid / does not exist.");
      RuleFor(x => x.DateOfBirth).Must(BeNotInFuture).WithMessage("'{PropertyName}' must not be in the future.");
      RuleFor(x => x.DateLastLogin).Must(BeNotInFuture).WithMessage("'{PropertyName}' must not be in the future.");
      //TODO: ExternalId
      //TODO: ZltoWalletId
      //TODO: ZltoWalletCountryId
      //TODO: TenantId
    }
    #endregion

    #region Private Members
    private bool BeNotInFuture(DateTimeOffset? date)
    {
      if (!date.HasValue) return true;
      return date <= DateTimeOffset.Now;
    }

    private bool CountryExists(Guid? countryId)
    {
      if (!countryId.HasValue) return true;
      return _countryService.GetByIdOrNull(countryId.Value) != null;
    }

    private bool GenderExists(Guid? genderId)
    {
      if (!genderId.HasValue) return true;
      return _genderService.GetByIdOrNull(genderId.Value) != null;
    }
    #endregion
  }
}

