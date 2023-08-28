using FluentValidation;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class OrganizationCreateRequestValidator : OrganizationRequestValidatorBase<OrganizationCreateRequest>
    {
        #region Class Variables
        private readonly IOrganizationProviderTypeService _organizationProviderTypeService;
        #endregion

        #region Constructor
        public OrganizationCreateRequestValidator(ICountryService countryService) : base(countryService)
        {
            RuleFor(x => x.ProviderTypeIds).Must(ids => ids != null && ids.Count > 0 && ids.All(id => id != Guid.Empty && ProviderTypeExist(id)))
                .WithMessage("Provider types contains items which are either invalid or do not exist");
            RuleFor(x => x.Logo).Must(file => file != null && file.Length > 0).WithMessage("Logo is required");
            RuleFor(x => x.AdminAdditionalEmails).Must(emails => emails != null && emails.All(email => !string.IsNullOrEmpty(email) && new EmailAddressAttribute().IsValid(email)))
                .WithMessage("Additional administrative emails contains invalid addresses");
            RuleFor(x => x.RegistrationDocuments).NotEmpty().WithMessage("Registration documents are required.")
                .ForEach(doc => doc.Must(file => file != null && file.Length > 0).WithMessage("Registration documents contains empty files."));
            RuleFor(x => x.EducationProviderDocuments)
                .Must(docs => docs == null || docs.Count > 0).WithMessage("Education provider documents can be null but not empty.")
                .ForEach(doc => doc.Must(file => file != null && file.Length > 0).WithMessage("Education provider documents contains empty files."));
            RuleFor(x => x.BusinessDocuments)
                .Must(docs => docs == null || docs.Count > 0).WithMessage("Business documents can be null but not empty.")
                .ForEach(doc => doc.Must(file => file != null && file.Length > 0).WithMessage("Business documents contains empty files."));
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
