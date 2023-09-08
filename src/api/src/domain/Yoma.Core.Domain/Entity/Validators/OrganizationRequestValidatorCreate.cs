using FluentValidation;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class OrganizationRequestValidatorCreate : OrganizationRequestValidatorBase<OrganizationRequestCreate>
    {
        #region Class Variables
        private readonly IOrganizationProviderTypeService _organizationProviderTypeService;
        #endregion

        #region Constructor
        public OrganizationRequestValidatorCreate(ICountryService countryService, IOrganizationProviderTypeService organizationProviderTypeService) : base(countryService)
        {
            _organizationProviderTypeService = organizationProviderTypeService;

            RuleFor(x => x.ProviderTypes).Must(providerTypes => providerTypes != null && providerTypes.Any() && providerTypes.All(id => id != Guid.Empty && ProviderTypeExist(id)))
                .WithMessage("Provider types is are required and must exist.");
            RuleFor(x => x.Logo).Must(file => file != null && file.Length > 0).WithMessage("Logo is required.");
            RuleFor(x => x.AdminAdditionalEmails).Must(emails => emails == null || emails.All(email => !string.IsNullOrEmpty(email) && new EmailAddressAttribute().IsValid(email)))
                .WithMessage("Additional administrative emails contain invalid addresses.")
                .When(x => x.AdminAdditionalEmails != null && x.AdminAdditionalEmails.Any());
            RuleFor(x => x.RegistrationDocuments).NotEmpty().WithMessage("Registration documents are required.")
                .ForEach(doc => doc.Must(file => file != null && file.Length > 0).WithMessage("Registration documents contains empty files."));
            RuleFor(x => x.EducationProviderDocuments)
                .Must(docs => docs != null && docs.All(file => file != null && file.Length > 0))
                .WithMessage("Education provider documents is optional but can not be empty.")
                .When(x => x.EducationProviderDocuments != null && x.EducationProviderDocuments.Any());
            RuleFor(x => x.BusinessDocuments)
                .Must(docs => docs != null && docs.All(file => file != null && file.Length > 0))
                .WithMessage("Business documents is optional but can not be empty.")
                .When(x => x.BusinessDocuments != null && x.BusinessDocuments.Any());
        }
        #endregion

        #region Private Members
        private bool ProviderTypeExist(Guid? id)
        {
            if (!id.HasValue) return true;
            return _organizationProviderTypeService.GetByIdOrNull(id.Value) != null;
        }
        #endregion
    }
}
