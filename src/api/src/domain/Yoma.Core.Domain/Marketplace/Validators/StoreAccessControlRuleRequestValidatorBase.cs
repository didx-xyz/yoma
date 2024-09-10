using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.Marketplace.Validators
{
  public class StoreAccessControlRuleRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : Models.StoreAccessControlRuleRequestBase
  {
    #region Class Variables
    private readonly IOrganizationService _organizationService;
    private readonly ICountryService _countryService;
    private readonly IMarketplaceService _marketplaceService;
    private readonly IGenderService _genderService;
    private readonly IOpportunityService _opportunityService;
    #endregion

    #region Constructor
    public StoreAccessControlRuleRequestValidatorBase(IOrganizationService organizationService,
      ICountryService countryService,
      IMarketplaceService marketplaceService,
      IGenderService genderService,
      IOpportunityService opportunityService)
    {
      _organizationService = organizationService;
      _countryService = countryService;
      _marketplaceService = marketplaceService;
      _genderService = genderService;
      _opportunityService = opportunityService;

      RuleFor(x => x.Name).NotEmpty().Length(1, 255).WithMessage("'{PropertyName}' is required and must be between 1 and 255 characters long.");

      RuleFor(x => x.Description).Length(1, 500).When(x => !string.IsNullOrEmpty(x.Description)).WithMessage("'{PropertyName}' must be between 1 and 500 characters.");

      RuleFor(x => x.OrganizationId).NotEmpty().Must(OrganizationActive).WithMessage("The selected organization is either invalid or inactive.");

      RuleFor(x => x.CountryCodeAlpha2).Must(value => !string.IsNullOrEmpty(value) && CountryExists(value)).WithMessage("{PropertyName} is required and must be a valid country alpha 2 code.");
      RuleFor(x => x.StoreId).NotEmpty().MustAsync((request, storeId, cancellationToken) => StoreExists(request.CountryCodeAlpha2, storeId)).WithMessage("{PropertyName} is required and must exist in the specified country.");

      RuleFor(x => x.StoreItemCategories).Must(x => x == null || x.Count == 0 || x.All(item => !string.IsNullOrWhiteSpace(item))).WithMessage("{PropertyName} contains empty or invalid value(s).")
          .MustAsync(async (request, categories, cancellationToken) =>
          {
            if (categories == null) return true;

            foreach (var category in categories)
              if (!await StoreItemCategoryExists(request.StoreId, category)) return false;
            return true;
          })
          .When(x => x.StoreItemCategories != null && x.StoreItemCategories.Count > 0)
          .WithMessage("One or more selected store item categories do not exist for the given store.");

      RuleFor(x => x.AgeFrom).GreaterThanOrEqualTo(0).When(x => x.AgeFrom.HasValue).WithMessage("From age must be 0 or greater.");
      RuleFor(x => x.AgeTo).GreaterThanOrEqualTo(0).When(x => x.AgeTo.HasValue).WithMessage("To age must be 0 or greater.");
      RuleFor(x => x).Must(x => !x.AgeFrom.HasValue || !x.AgeTo.HasValue || x.AgeTo > x.AgeFrom).WithMessage("To age must be greater than from age when both are specified.");

      RuleFor(x => x.GenderId).Must(id => !id.HasValue || GenderExistsAndValid(id.Value)).WithMessage($"Selected gender does not exist or is invalid ('{Gender.PreferNotToSay.ToDescription()}' not allowed).");

      RuleFor(x => x.Opportunities).Must((request, opportunities) => opportunities == null || opportunities.Count == 0 || opportunities.All(id => OpporunityExistAndValid(id, request.OrganizationId)))
        .WithMessage("{PropertyName} must exist, belong to the specified organization, be published, and have verification enabled.");

      RuleFor(x => x.OpportunityOption).NotNull().When(x => x.Opportunities != null && x.Opportunities.Count > 0).WithMessage("{PropertyName} is required when opportunities are specified.");
    }
    #endregion

    #region Private Memebers
    private bool OrganizationActive(Guid id)
    {
      if (id == Guid.Empty) return false;
      var organization = _organizationService.GetByIdOrNull(id, false, false, false);
      return organization != null && organization.Status == Entity.OrganizationStatus.Active;
    }

    private bool CountryExists(string countryCodeAlpha2)
    {
      if (string.IsNullOrEmpty(countryCodeAlpha2)) return false;
      return _countryService.GetByCodeAplha2OrNull(countryCodeAlpha2) != null;
    }

    private async Task<bool> StoreExists(string countryCodeAlpha2, string storeId)
    {
      if (string.IsNullOrEmpty(countryCodeAlpha2)) return false;
      if (string.IsNullOrEmpty(storeId)) return false;

      var result = await _marketplaceService.SearchStores(new Models.StoreSearchFilter { CountryCodeAlpha2 = countryCodeAlpha2 });
      return result.Items.Any(x => x.Id == storeId);
    }

    private async Task<bool> StoreItemCategoryExists(string storeId, string storeItemCategoryId)
    {
      if (string.IsNullOrEmpty(storeId)) return false;
      if (string.IsNullOrEmpty(storeItemCategoryId)) return false;

      var result = await _marketplaceService.SearchStoreItemCategories(new Models.StoreItemCategorySearchFilter { StoreId = storeId });
      return result.Items.Any(x => x.Id == storeItemCategoryId);
    }

    private bool GenderExistsAndValid(Guid id)
    {
      if (id == Guid.Empty) return false;

      var item = _genderService.GetByIdOrNull(id);
      if (item == null) return false;

      return  !string.Equals(item.Name, Gender.PreferNotToSay.ToDescription(), StringComparison.InvariantCultureIgnoreCase);
    }

    private bool OpporunityExistAndValid(Guid id, Guid organizationId)
    {
      if (id == Guid.Empty) return false;

      var opportunity = _opportunityService.GetByIdOrNull(id, false, true, false);

      return opportunity != null && opportunity.OrganizationId == organizationId && opportunity.Published && opportunity.VerificationEnabled;
    }
    #endregion
  }
}
