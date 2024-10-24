using FluentValidation;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class UserProfileRequestValidator : UserRequestValidatorBase<UserRequestProfile>
  {
    #region Class Variables
    #endregion

    #region Constructor
    public UserProfileRequestValidator(ICountryService countryService, IEducationService educationService,
        IGenderService genderService) : base(countryService, educationService, genderService)
    {
      RuleFor(x => x.FirstName).NotEmpty().Length(1, 125);
      RuleFor(x => x.Surname).NotEmpty().Length(1, 125);
    }
    #endregion
  }
}
