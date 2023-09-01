using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Opportunity.Validators
{
    public class OpportunityRequestValidatorCreate : OpportunityRequestValidatorBase<Models.OpportunityRequestCreate>
    {
        #region Class Variables
        private readonly IOpportunityCategoryService _opportunityCategoryService;
        private readonly ICountryService _countryService;
        private readonly ILanguageService _languageService;
        private readonly ISkillService _skillService;
        #endregion

        #region Constructor
        public OpportunityRequestValidatorCreate(IOpportunityTypeService opportunityTypeService,
            IOrganizationService organizationService,
            IOpportunityDifficultyService opportunityDifficultyService,
            ITimeIntervalService timeIntervalService,
            IOpportunityCategoryService opportunityCategoryService,
            ICountryService countryService,
            ILanguageService languageService,
            ISkillService skillService) : base(opportunityTypeService, organizationService, opportunityDifficultyService, timeIntervalService)
        {
            _opportunityCategoryService = opportunityCategoryService;
            _countryService = countryService;
            _languageService = languageService;
            _skillService = skillService;

            RuleFor(x => x.Categories).Must(categories => categories != null && categories.Any() && categories.All(id => id != Guid.Empty && CategoryExist(id)))
                .WithMessage("Categories are required and must exist");
            RuleFor(x => x.Countries).Must(countries => countries != null && countries.Any() && countries.All(id => id != Guid.Empty && CountryExist(id)))
                .WithMessage("Countries are required and must exist");
            RuleFor(x => x.Languages).Must(languages => languages != null && languages.Any() && languages.All(id => id != Guid.Empty && LanguageExist(id)))
                .WithMessage("Languages are required and must exist");
            RuleFor(x => x.Skills).Must(skills => skills != null && skills.Any() && skills.All(id => id != Guid.Empty && SkillExist(id)))
                .WithMessage("Skills are required and must exist");
        }
        #endregion

        #region Private Members
        private bool CategoryExist(Guid? id)
        {
            if (!id.HasValue) return true;
            return _opportunityCategoryService.GetByIdOrNull(id.Value) != null;
        }

        private bool CountryExist(Guid? id)
        {
            if (!id.HasValue) return true;
            return _countryService.GetByIdOrNull(id.Value) != null;
        }

        private bool LanguageExist(Guid? id)
        {
            if (!id.HasValue) return true;
            return _languageService.GetByIdOrNull(id.Value) != null;
        }

        private bool SkillExist(Guid? id)
        {
            if (!id.HasValue) return true;
            return _skillService.GetByIdOrNull(id.Value) != null;
        }
        #endregion
    }
}
