using FluentValidation;
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
      RuleFor(x => x.RegistrationDocuments).NotEmpty().WithMessage("Registration documents are required."); //see base validator; if specified, not null or empty
    }
    #endregion
  }
}
