using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleRequestValidatorCreate : StoreAccessControlRuleRequestValidatorBase<Models.StoreAccessControlRuleRequestCreate>
  {
    #region Constructor
    public StoreAccessControlRuleRequestValidatorCreate(ICountryService countryService,
      IGenderService genderService)
        : base(countryService, genderService)
    {
    }
    #endregion
  }
}
