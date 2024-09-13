using FluentValidation;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleRequestValidatorUpdate : StoreAccessControlRuleRequestValidatorBase<Models.StoreAccessControlRuleRequestUpdate>
  {
    #region Constructor
    public StoreAccessControlRuleRequestValidatorUpdate(ICountryService countryService,
      IGenderService genderService)
        : base(countryService, genderService)
    {
      RuleFor(x => x.Id).NotEmpty();
    }
    #endregion
  }
}
