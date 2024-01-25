using FluentValidation;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class UserRequestValidator : UserRequestValidatorBase<UserRequest>
    {
        #region Class Variables
        #endregion

        #region Constructor
        public UserRequestValidator(ICountryService countryService,
            IGenderService genderService) : base(countryService, genderService)
        {
            RuleFor(x => x.Id).NotEmpty().When(x => x.Id.HasValue);
            RuleFor(x => x.DateLastLogin).Must(NotInFuture).WithMessage("'{PropertyName}' is in the future.");
            //TODO: ExternalId
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
