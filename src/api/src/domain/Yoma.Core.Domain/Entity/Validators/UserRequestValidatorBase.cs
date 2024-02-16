using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public abstract class UserRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : UserRequestBase
    {
        #region Class Variables
        private readonly ICountryService _countryService;
        private readonly IEducationService _educationService;
        private readonly IGenderService _genderService;
        #endregion

        #region Constructor
        public UserRequestValidatorBase(ICountryService countryService,
            IEducationService educationService,
            IGenderService genderService)
        {
            _countryService = countryService;
            _educationService = educationService;
            _genderService = genderService;

            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.FirstName).NotEmpty().Length(1, 320);
            RuleFor(x => x.Surname).NotEmpty().Length(1, 320);
            RuleFor(x => x.PhoneNumber).Length(1, 50).Matches(RegExValidators.PhoneNumber()).WithMessage("'{PropertyName}' is invalid.").When(x => !string.IsNullOrEmpty(x.PhoneNumber));
            RuleFor(x => x.CountryId).Must(CountryExists).WithMessage($"Specified country is invalid / does not exist.");
            RuleFor(x => x.EducationId).Must(EducationExists).WithMessage($"Specified education is invalid / does not exist.");
            RuleFor(x => x.GenderId).Must(GenderExists).WithMessage($"Specified gender is invalid / does not exist.");
            RuleFor(x => x.DateOfBirth).Must(NotInFuture).WithMessage("'{PropertyName}' is in the future.");
        }
        #endregion

        #region Private Members
        private bool NotInFuture(DateTimeOffset? date)
        {
            if (!date.HasValue) return true;
            return date <= DateTimeOffset.UtcNow;
        }

        private bool CountryExists(Guid? countryId)
        {
            if (!countryId.HasValue) return true;
            return _countryService.GetByIdOrNull(countryId.Value) != null;
        }

        private bool EducationExists(Guid? educationId)
        {
            if (!educationId.HasValue) return true;
            return _educationService.GetByIdOrNull(educationId.Value) != null;
        }

        private bool GenderExists(Guid? genderId)
        {
            if (!genderId.HasValue) return true;
            return _genderService.GetByIdOrNull(genderId.Value) != null;
        }
        #endregion
    }
}
