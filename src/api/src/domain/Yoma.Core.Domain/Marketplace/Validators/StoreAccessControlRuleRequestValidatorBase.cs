using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Lookups.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : Models.StoreAccessControlRuleRequestBase
  {
    #region Class Variables
    private readonly ICountryService _countryService;
    private readonly IGenderService _genderService;
    #endregion

    #region Constructor
    public StoreAccessControlRuleRequestValidatorBase(ICountryService countryService,
      IGenderService genderService)
    {
      _countryService = countryService;
      _genderService = genderService;

      RuleFor(x => x.Name).NotEmpty().Length(1, 255).WithMessage("'{PropertyName}' is required and must be between 1 and 255 characters long.");

      RuleFor(x => x.Description).Length(1, 500).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("'{PropertyName}' must be between 1 and 500 characters.");

      RuleFor(x => x.OrganizationId).NotEmpty().WithMessage("Organization is required.");

      RuleFor(x => x.StoreCountryCodeAlpha2).Must(value => !string.IsNullOrEmpty(value) && CountryExists(value)).WithMessage("{PropertyName} is required and must be a valid country alpha 2 code.");
      RuleFor(x => x.StoreId).NotEmpty().WithMessage("{PropertyName} is required.");

      RuleFor(x => x.StoreItemCategories)
          .Must(x => x == null || (x.Count > 0 && x.All(item => !string.IsNullOrWhiteSpace(item))))
          .WithMessage("{PropertyName} must contain at least one item if provided, and cannot contain empty values.");

      RuleFor(x => x.AgeFrom).GreaterThanOrEqualTo(0).When(x => x.AgeFrom.HasValue).WithMessage("From age must be 0 or greater.");
      RuleFor(x => x.AgeTo).GreaterThanOrEqualTo(0).When(x => x.AgeTo.HasValue).WithMessage("To age must be 0 or greater.");
      RuleFor(x => x).Must(x => !x.AgeFrom.HasValue || !x.AgeTo.HasValue || x.AgeTo > x.AgeFrom).WithMessage("To age must be greater than from age when both are specified.");

      RuleFor(x => x.GenderId).Must(id => !id.HasValue || GenderExistsAndValid(id.Value)).WithMessage($"Selected gender does not exist or is invalid ('{Gender.PreferNotToSay.ToDescription()}' not allowed).");

      RuleFor(x => x.Opportunities)
        .Must(opportunities => opportunities == null || (opportunities.Count > 0 && opportunities.All(id => id != Guid.Empty)))
        .WithMessage("{PropertyName} must contain at least one item if provided, and cannot contain empty or invalid values.");

      RuleFor(x => x.OpportunityOption).NotNull().When(x => x.Opportunities != null && x.Opportunities.Count > 0).WithMessage("{PropertyName} is required when opportunities are specified.");
    }
    #endregion

    #region Private Memebers
    private bool CountryExists(string countryCodeAlpha2)
    {
      if (string.IsNullOrEmpty(countryCodeAlpha2)) return false;
      return _countryService.GetByCodeAplha2OrNull(countryCodeAlpha2) != null;
    }

    private bool GenderExistsAndValid(Guid id)
    {
      if (id == Guid.Empty) return false;

      var item = _genderService.GetByIdOrNull(id);
      if (item == null) return false;

      return !string.Equals(item.Name, Gender.PreferNotToSay.ToDescription(), StringComparison.InvariantCultureIgnoreCase);
    }
    #endregion
  }
}
