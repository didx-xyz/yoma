using FluentValidation;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
  public abstract class OrganizationRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : OrganizationRequestBase
  {
    #region Class Variables
    private readonly ICountryService _countryService;
    private readonly IOrganizationProviderTypeService _organizationProviderTypeService;
    #endregion

    #region Constructor
    public OrganizationRequestValidatorBase(ICountryService countryService, IOrganizationProviderTypeService organizationProviderTypeService)
    {
      _countryService = countryService;
      _organizationProviderTypeService = organizationProviderTypeService;

      RuleFor(x => x.Name).NotEmpty().Length(1, 80).WithMessage("'{PropertyName}' is required and must be between 1 and 80 characters long.");
      RuleFor(x => x.WebsiteURL).Length(1, 2048).Must(ValidURL).WithMessage("'{PropertyName}' is invalid.");
      RuleFor(x => x.PrimaryContactName).NotEmpty().Length(1, 255).WithMessage("'{PropertyName}' is required must be between 1 and 255 characters.");
      RuleFor(x => x.PrimaryContactEmail).NotEmpty().Length(1, 320).EmailAddress().WithMessage("'{PropertyName}' is required and must be a valid email address.");
      RuleFor(x => x.PrimaryContactPhone).NotEmpty().Length(1, 50).Must(PhoneNumberValidator.IsValidPhoneNumber).WithMessage("'{PropertyName}' is required and must be a valid phone number.");
      RuleFor(x => x.VATIN).Length(1, 255).When(x => !string.IsNullOrEmpty(x.VATIN)).WithMessage("'{PropertyName}' must be between 1 and 255 characters.");
      RuleFor(x => x.TaxNumber).Length(1, 255).When(x => !string.IsNullOrEmpty(x.TaxNumber)).WithMessage("'{PropertyName}' must be between 1 and 255 characters.");
      RuleFor(x => x.RegistrationNumber).Length(1, 255).When(x => !string.IsNullOrEmpty(x.RegistrationNumber)).WithMessage("'{PropertyName}' must be between 1 and 255 characters.");
      RuleFor(x => x.City).NotEmpty().Length(1, 50).WithMessage("'{PropertyName}' is required and must be between 1 and 50 characters long.");
      RuleFor(x => x.CountryId).NotEmpty().WithMessage("Country is required.").Must(CountryExists).WithMessage($"Specified country is invalid / does not exist.");
      RuleFor(x => x.StreetAddress).NotEmpty().Length(1, 500).WithMessage("'{PropertyName}' is required and must be between 1 and 500 characters long.");
      RuleFor(x => x.Province).NotEmpty().Length(1, 255).WithMessage("'{PropertyName}' is required and must be between 1 and 255 characters long.");
      RuleFor(x => x.PostalCode).NotEmpty().Length(1, 10).WithMessage("'{PropertyName}' is required and must be between 1 and 10 characters long.");
      RuleFor(x => x.Tagline).Length(1, 160).When(x => !string.IsNullOrEmpty(x.Tagline)).WithMessage("'{PropertyName}' must be between 1 and 160 characters.");
      RuleFor(x => x.Biography).Length(1, 480).When(x => !string.IsNullOrEmpty(x.Biography)).WithMessage("'{PropertyName}' must be between 1 and 480 characters.");

      RuleFor(x => x.Logo).Must(file => file == null || file.Length > 0).WithMessage("Logo is optional, but if specified, can not be empty.");

      RuleFor(x => x.ProviderTypes).Must(providerTypes => providerTypes != null && providerTypes.Count != 0 && providerTypes.All(id => id != Guid.Empty && ProviderTypeExists(id)))
          .WithMessage("Provider types are required and must exist.");

      RuleFor(x => x.RegistrationDocuments)
          .ForEach(docs => docs.Must(doc => doc != null && doc.Length > 0)
          .WithMessage("Registration documents are optional, but if specified, cannot be empty."))
          .When(x => x.RegistrationDocuments != null && x.RegistrationDocuments.Count != 0);

      RuleFor(x => x.EducationProviderDocuments)
        .ForEach(docs => docs.Must(doc => doc != null && doc.Length > 0)
        .WithMessage("Education provider documents are optional, but if specified, cannot be empty."))
        .When(x => x.EducationProviderDocuments != null && x.EducationProviderDocuments.Count > 0);

      RuleFor(x => x.BusinessDocuments)
        .ForEach(docs => docs.Must(doc => doc != null && doc.Length > 0)
        .WithMessage("Business documents are optional, but if specified, cannot be empty."))
        .When(x => x.BusinessDocuments != null && x.BusinessDocuments.Count > 0);

      RuleFor(x => x.Admins).Must(items => items != null && items.Count != 0).When(x => !x.AddCurrentUserAsAdmin)
          .WithMessage("Additional administrators are required if not adding the current user as an admin.");

      RuleFor(x => x.Admins)
        .Must(items => items != null && items.All(admin =>
            (!string.IsNullOrWhiteSpace(admin) &&
            (new EmailAddressAttribute().IsValid(admin) || PhoneNumberValidator.IsValidPhoneNumber(admin))
            )))
        .WithMessage("Additional administrative username(s) must contain either a valid email address or phone number.")
        .When(x => x.Admins != null && x.Admins.Count != 0);

      RuleFor(x => x.ZltoRewardPool)
          .GreaterThan(0).When(x => x.ZltoRewardPool.HasValue).WithMessage("'{PropertyName}' must be greater than 0.")
          .LessThanOrEqualTo(10000000M).When(x => x.ZltoRewardPool.HasValue).WithMessage("'{PropertyName}' must not exceed 10 million.")
          .Must(zltoRewardPool => zltoRewardPool % 1 == 0).When(x => x.ZltoRewardPool.HasValue).WithMessage("'{PropertyName}' does not support decimal points.");

      RuleFor(x => x.YomaRewardPool)
          .GreaterThan(0).When(x => x.YomaRewardPool.HasValue).WithMessage("'{PropertyName}' must be greater than 0.")
          .LessThanOrEqualTo(10000000M).When(x => x.YomaRewardPool.HasValue).WithMessage("'{PropertyName}' must not exceed 10 million.");
    }
    #endregion

    #region Private Members
    private bool ValidURL(string? url)
    {
      if (url == null) return true;
      return Uri.IsWellFormedUriString(url, UriKind.Absolute);
    }

    private bool CountryExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _countryService.GetByIdOrNull(id.Value) != null;
    }

    private bool ProviderTypeExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _organizationProviderTypeService.GetByIdOrNull(id.Value) != null;
    }
    #endregion
  }
}
