using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleRequestValidatorCreate : StoreAccessControlRuleRequestValidatorBase<Models.StoreAccessControlRuleRequestCreate>
  {
    #region Constructor
    public StoreAccessControlRuleRequestValidatorCreate(ICountryService countryService,
      IMarketplaceService marketplaceService,
      IGenderService genderService)
        : base(countryService, marketplaceService, genderService)
    {
    }
    #endregion
  }
}
