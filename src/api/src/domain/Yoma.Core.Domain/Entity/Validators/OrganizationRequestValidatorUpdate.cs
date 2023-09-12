using FluentValidation;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Entity.Validators
{
    public class OrganizationRequestValidatorUpdate : OrganizationRequestValidatorBase<OrganizationRequestUpdate>
    {
        #region Class Variables
        #endregion

        #region Constructor
        public OrganizationRequestValidatorUpdate(ICountryService countryService,
            IOrganizationProviderTypeService organizationProviderTypeService)
            : base(countryService, organizationProviderTypeService)
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.AdminEmails).Must(emails => emails != null && emails.All(email => !string.IsNullOrEmpty(email) && new EmailAddressAttribute().IsValid(email)))
                .WithMessage("Administrative emails are required and must contain valid email addresses");
            RuleFor(x => x.RegistrationDocumentsDelete).Must(ids => ids == null || ids.All(o => o != Guid.Empty)).WithMessage("{PropertyName} contains empty value(s).");
        }
        #endregion
    }
}
