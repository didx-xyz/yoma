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

      RuleFor(x => x.ZltoRewardPoolCurrentFinancialYear)
          .GreaterThan(0).When(x => x.ZltoRewardPoolCurrentFinancialYear.HasValue).WithMessage("'{PropertyName}' must be greater than 0.")
          .LessThanOrEqualTo(10_000_000M).When(x => x.ZltoRewardPoolCurrentFinancialYear.HasValue).WithMessage("'{PropertyName}' must not exceed 10 million.")
          .Must(pool => !pool.HasValue || pool.Value % 1 == 0).WithMessage("'{PropertyName}' does not support decimal points.");
    }
    #endregion
  }
}
