using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public abstract class OrganizationRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : OrganizationRequestBase
    {
        #region Class Variables
        private readonly ICountryService _countryService;
        #endregion

        #region Constructor
        public OrganizationRequestValidatorBase(ICountryService countryService)
        {
            _countryService = countryService;

            RuleFor(x => x.Name).NotEmpty().Length(1, 80);
            RuleFor(x => x.WebsiteURL).Length(1, 2048).Must(ValidURL).WithMessage("'{PropertyName}' is invalid.");
            RuleFor(x => x.PrimaryContactName).Length(1, 255).When(x => !string.IsNullOrEmpty(x.PrimaryContactName));
            RuleFor(x => x.PrimaryContactEmail).Length(1, 320).EmailAddress().When(x => !string.IsNullOrEmpty(x.PrimaryContactEmail));
            RuleFor(x => x.PrimaryContactPhone).Length(1, 50).Matches(RegExValidators.PhoneNumber()).WithMessage("'{PropertyName}' is invalid.").When(x => !string.IsNullOrEmpty(x.PrimaryContactPhone));
            RuleFor(x => x.VATIN).Length(1, 255).When(x => !string.IsNullOrEmpty(x.VATIN));
            RuleFor(x => x.TaxNumber).Length(1, 255).When(x => !string.IsNullOrEmpty(x.TaxNumber));
            RuleFor(x => x.RegistrationNumber).Length(1, 255).When(x => !string.IsNullOrEmpty(x.RegistrationNumber));
            RuleFor(x => x.City).Length(1, 50).When(x => !string.IsNullOrEmpty(x.City));
            RuleFor(x => x.CountryId).Must(CountryExists).WithMessage($"Specified country is invalid / does not exist.");
            RuleFor(x => x.StreetAddress).Length(1, 500).When(x => !string.IsNullOrEmpty(x.StreetAddress));
            RuleFor(x => x.Province).Length(1, 255).When(x => !string.IsNullOrEmpty(x.Province));
            RuleFor(x => x.PostalCode).Length(1, 10).When(x => !string.IsNullOrEmpty(x.PostalCode));
            RuleFor(x => x.Tagline).Length(1, 160).When(x => !string.IsNullOrEmpty(x.PostalCode));
            RuleFor(x => x.Biography).Length(1, 480).When(x => !string.IsNullOrEmpty(x.PostalCode));
        }
        #endregion

        #region Private Members
        private bool ValidURL(string? url)
        {
            if (url == null) return true;
            return Uri.IsWellFormedUriString(url, UriKind.Absolute);
        }

        private bool CountryExists(Guid? countryId)
        {
            if (!countryId.HasValue) return true;
            return _countryService.GetByIdOrNull(countryId.Value) != null;
        }
        #endregion
    }
}
