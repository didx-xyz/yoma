using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunityRequestValidatorUpdate : OpportunityRequestValidatorBase<Models.OpportunityRequestUpdate>
  {
    #region Constructor
    public OpportunityRequestValidatorUpdate(IOpportunityTypeService opportunityTypeService,
        IOrganizationService organizationService,
        IEngagementTypeService engagementTypeService,
        ITimeIntervalService timeIntervalService,
        IOpportunityCategoryService opportunityCategoryService,
        ICountryService countryService,
        ILanguageService languageService,
        ISkillService skillService,
        IOpportunityVerificationTypeService opportunityVerificationTypeService,
        OpportunityRequestCountryValidator opportunityRequestCountryValidator,
        ICurrencyService currencyService,
        IAccessibilityService accessibilityService,
        ITargetedGroupService targetedGroupService,
        ISustainableDevelopmentGoalService sustainableDevelopmentGoalService)
        : base(opportunityTypeService,
        organizationService,
        engagementTypeService,
        timeIntervalService,
        opportunityCategoryService,
        countryService,
        languageService,
        skillService,
        opportunityVerificationTypeService,
        opportunityRequestCountryValidator,
        currencyService,
        accessibilityService,
        targetedGroupService,
        sustainableDevelopmentGoalService)
    {
      RuleFor(x => x.Id)
          .NotEmpty();
    }
    #endregion
  }
}
