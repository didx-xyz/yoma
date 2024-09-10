using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleRequestValidatorUpdate : StoreAccessControlRuleRequestValidatorBase<Models.StoreAccessControlRuleRequestUpdate>
  {
    #region Constructor
    public StoreAccessControlRuleRequestValidatorUpdate(IOrganizationService organizationService,
      ICountryService countryService,
      IMarketplaceService marketplaceService,
      IGenderService genderService,
      IOpportunityService opportunityService)
        : base(organizationService, countryService, marketplaceService, genderService, opportunityService)
    {
      RuleFor(x => x.Id).NotEmpty();
    }
    #endregion
  }
}
