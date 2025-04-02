using FluentValidation;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserRequestValidator : UserRequestValidatorBase<UserRequest>
  {
    #region Class Variables
    #endregion

    #region Constructor
    public UserRequestValidator(ICountryService countryService, IEducationService educationService,
        IGenderService genderService) : base(countryService, educationService, genderService)
    {
      RuleFor(x => x.Id).NotEmpty().When(x => x.Id.HasValue);
      RuleFor(x => x.Username).NotEmpty();
      RuleFor(x => x.FirstName).Length(1, 125).When(x => !string.IsNullOrEmpty(x.FirstName));
      RuleFor(x => x.Surname).Length(1, 125).When(x => !string.IsNullOrEmpty(x.Surname));
      RuleFor(x => x.PhoneNumber).Length(1, 50).Must(PhoneNumberValidator.IsValidPhoneNumber).WithMessage("'{PropertyName}' is invalid.").When(x => !string.IsNullOrEmpty(x.PhoneNumber));
      RuleFor(x => x.DateLastLogin).Must(NotInFuture).WithMessage("'{PropertyName}' is in the future.");
    }
    #endregion

    #region Private Members
    private bool NotInFuture(DateTimeOffset? date)
    {
      if (!date.HasValue) return true;
      return date <= DateTimeOffset.UtcNow;
    }
    #endregion
  }
}
