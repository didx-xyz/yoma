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
            IOpportunityDifficultyService opportunityDifficultyService,
            ITimeIntervalService timeIntervalService,
            IOpportunityCategoryService opportunityCategoryService,
            ICountryService countryService,
            ILanguageService languageService,
            ISkillService skillService,
            IOpportunityVerificationTypeService opportunityVerificationTypeService)
            : base(opportunityTypeService, organizationService, opportunityDifficultyService, timeIntervalService,
                  opportunityCategoryService, countryService, languageService, skillService, opportunityVerificationTypeService)
        {
            RuleFor(x => x.Id).NotEmpty();
        }
        #endregion
    }
}
