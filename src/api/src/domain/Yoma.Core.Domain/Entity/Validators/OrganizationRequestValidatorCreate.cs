using FluentValidation;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class OrganizationRequestValidatorCreate : OrganizationRequestValidatorBase<OrganizationRequestCreate>
    {
        #region Constructor
        public OrganizationRequestValidatorCreate(ICountryService countryService, IOrganizationProviderTypeService organizationProviderTypeService) : base(countryService, organizationProviderTypeService)
        {
            RuleFor(x => x.Logo).Must(file => file != null && file.Length > 0).WithMessage("Logo is required.");
            RuleFor(x => x.AdminAdditionalEmails).Must(emails => emails != null && emails.Any()).When(x => !x.AddCurrentUserAsAdmin)
                .WithMessage("Additional administrative emails are required provided not adding the current user as an admin.");
            RuleFor(x => x.AdminAdditionalEmails).Must(emails => emails != null && emails.All(email => !string.IsNullOrEmpty(email) && new EmailAddressAttribute().IsValid(email)))
                .WithMessage("Additional administrative emails contain invalid addresses.")
                .When(x => x.AdminAdditionalEmails != null && x.AdminAdditionalEmails.Any());
            RuleFor(x => x.RegistrationDocuments).NotEmpty().WithMessage("Registration documents are required.")
                .ForEach(doc => doc.Must(file => file != null && file.Length > 0).WithMessage("Registration documents contains empty files."));
        }
        #endregion
    }
}
