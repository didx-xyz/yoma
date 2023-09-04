using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Opportunity.Validators
{
    public class OpportunityRequestValidatorCreate : OpportunityRequestValidatorBase<Models.OpportunityRequestCreate>
    {
        #region Constructor
        public OpportunityRequestValidatorCreate(IOpportunityTypeService opportunityTypeService,
            IOrganizationService organizationService,
            IOpportunityDifficultyService opportunityDifficultyService,
            ITimeIntervalService timeIntervalService,
            IOpportunityCategoryService opportunityCategoryService,
            ICountryService countryService,
            ILanguageService languageService,
            ISkillService skillService)
            : base(opportunityTypeService, organizationService, opportunityDifficultyService, timeIntervalService,
                  opportunityCategoryService, countryService, languageService, skillService) { }
        #endregion
    }
}
