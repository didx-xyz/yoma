using FluentValidation;
using Yoma.Core.Domain.Core.Validators;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public class OrganizationRequestValidator : AbstractValidator<OrganizationRequest>
  {
    #region Class Variables
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public OrganizationRequestValidator(ICountryService countryService)
    {
      _countryService = countryService;

      RuleFor(x => x.Name).NotEmpty().Length(1, 255);
      RuleFor(x => x.WebsiteURL).Length(1, 2048).Must(ValidURL).WithMessage("'{PropertyName}' is invalid.");
      RuleFor(x => x.PrimaryContactName).Length(0, 255);
      RuleFor(x => x.PrimaryContactEmail).Length(0, 320).EmailAddress();
      RuleFor(x => x.PrimaryContactPhone).Length(0, 50).Matches(RegExValidators.PhoneNumber()).WithMessage("'{PropertyName}' is invalid.").When(x => !string.IsNullOrEmpty(x.PrimaryContactPhone));
      RuleFor(x => x.VATIN).Length(0, 255); RuleFor(x => x.TaxNumber).Length(0, 255);
      RuleFor(x => x.RegistrationNumber).Length(0, 255);
      RuleFor(x => x.City).Length(0, 50);
      RuleFor(x => x.CountryId).Must(CountryExists).WithMessage($"Specified country is invalid / does not exist.");
      RuleFor(x => x.StreetAddress).Length(0, 500);
      RuleFor(x => x.Province).Length(0, 255);
      RuleFor(x => x.PostalCode).Length(0, 10);
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
