using FluentValidation;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleRequestValidatorUpdate : StoreAccessControlRuleRequestValidatorBase<Models.StoreAccessControlRuleRequestUpdate>
  {
    #region Constructor
    public StoreAccessControlRuleRequestValidatorUpdate(ICountryService countryService,
      IMarketplaceService marketplaceService,
      IGenderService genderService)
        : base(countryService, marketplaceService, genderService)
    {
      RuleFor(x => x.Id).NotEmpty();
    }
    #endregion
  }
}
