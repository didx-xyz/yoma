using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Interfaces;

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
            IOpportunityVerificationTypeService opportunityVerificationTypeService,
            ISSISchemaService ssiSchemaService)
            : base(opportunityTypeService, organizationService, opportunityDifficultyService, timeIntervalService,
                  opportunityCategoryService, countryService, languageService, skillService, opportunityVerificationTypeService, ssiSchemaService)
        {
            RuleFor(x => x.Id).NotEmpty();
        }
        #endregion
    }
}
