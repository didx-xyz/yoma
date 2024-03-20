using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public class OpportunityRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : Models.OpportunityRequestBase
  {
    #region Class Variables
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOrganizationService _organizationService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
    private readonly ISSISchemaService _ssiSchemaService;
    #endregion

    #region Public Members
    public OpportunityRequestValidatorBase(IOpportunityTypeService opportunityTypeService,
        IOrganizationService organizationService,
        IOpportunityDifficultyService opportunityDifficultyService,
        ITimeIntervalService timeIntervalService,
        IOpportunityCategoryService opportunityCategoryService,
        ICountryService countryService,
        ILanguageService languageService,
        ISkillService skillService,
        IOpportunityVerificationTypeService opportunityVerificationTypeService,
        ISSISchemaService ssiSchemaService)
    {
      _opportunityTypeService = opportunityTypeService;
      _organizationService = organizationService;
      _opportunityDifficultyService = opportunityDifficultyService;
      _timeIntervalService = timeIntervalService;
      _opportunityCategoryService = opportunityCategoryService;
      _countryService = countryService;
      _languageService = languageService;
      _skillService = skillService;
      _opportunityVerificationTypeService = opportunityVerificationTypeService;
      _ssiSchemaService = ssiSchemaService;

      RuleFor(x => x.Title).NotEmpty().Length(1, 255);
      RuleFor(x => x.Description).NotEmpty();
      RuleFor(x => x.TypeId).NotEmpty().Must(TypeExists).WithMessage($"Specified type is invalid / does not exist.");
      RuleFor(x => x.OrganizationId).NotEmpty().Must(OrganizationUpdatable).WithMessage($"Specified organization has been declined / deleted or does not exist.");
      //instructions (varchar(max); auto trimmed
      RuleFor(x => x.URL).Length(1, 2048).Must(ValidURL).When(x => string.IsNullOrEmpty(x.URL)).WithMessage("'{PropertyName}' is invalid.");
      RuleFor(x => x.ZltoReward)
          .GreaterThan(0).When(x => x.ZltoReward.HasValue).WithMessage("{PropertyName} must be greater than 0")
          .Must(zltoReward => zltoReward % 1 == 0).When(x => x.ZltoReward.HasValue).WithMessage("{PropertyName} does not support decimal points");
      RuleFor(x => x.YomaReward).GreaterThan(0).When(x => x.YomaReward.HasValue).WithMessage("'{PropertyName}' must be greater than 0.");
      RuleFor(x => x.ZltoRewardPool).GreaterThan(0).When(x => x.ZltoRewardPool.HasValue).WithMessage("'{PropertyName}' must be greater than 0.")
          .Must((model, zltoRewardPool) => !model.ZltoRewardPool.HasValue || (model.ZltoReward.HasValue && zltoRewardPool >= model.ZltoReward)).WithMessage("'{PropertyName}' must be greater than or equal to ZltoReward.");
      RuleFor(x => x.YomaRewardPool).GreaterThan(0).When(x => x.YomaRewardPool.HasValue).WithMessage("'{PropertyName}' must be greater than 0.")
          .Must(YomaRewardPool => YomaRewardPool % 1 == 0).When(x => x.YomaReward.HasValue).WithMessage("{PropertyName} does not support decimal points")
          .Must((model, yomaRewardPool) => !model.YomaRewardPool.HasValue || (model.YomaReward.HasValue && yomaRewardPool >= model.YomaReward)).WithMessage("'{PropertyName}' must be greater than or equal to YomaReward.");
      RuleFor(x => x.VerificationMethod)
          .NotNull()
          .When(x => x.VerificationEnabled)
          .WithMessage("A verification method is required when verification is enabled.");
      RuleFor(x => x.DifficultyId).NotEmpty().Must(DifficultyExists).WithMessage($"Specified difficulty is invalid / does not exist.");
      RuleFor(x => x.CommitmentIntervalId).NotEmpty().Must(TimeIntervalExists).WithMessage($"Specified time interval is invalid / does not exist.");
      RuleFor(x => x.CommitmentIntervalCount).Must(x => x > 0).WithMessage("'{PropertyName}' must be greater than 0.");
      RuleFor(x => x.ParticipantLimit).Must(x => x.HasValue && x > 0).When(x => x.ParticipantLimit.HasValue).WithMessage("'{PropertyName}' must be greater than 0.");
      RuleFor(x => x.Keywords).Must(keywords => keywords == null || keywords.All(x => !string.IsNullOrWhiteSpace(x) && !x.Contains(OpportunityService.Keywords_Separator))).WithMessage("{PropertyName} contains empty value(s) or keywords with ',' character.");
      RuleFor(model => model.Keywords).Must(list => list == null || CalculateCombinedLength(list) >= 1 && CalculateCombinedLength(list) <= OpportunityService.Keywords_CombinedMaxLength).WithMessage("The combined length of keywords must be between 1 and 500 characters.");
      RuleFor(x => x.DateStart).NotEmpty(); //start date can be in the past
      RuleFor(model => model.DateEnd) //end date can be in the past
          .GreaterThanOrEqualTo(model => model.DateStart)
          .When(model => model.DateEnd.HasValue)
          .WithMessage("{PropertyName} is earlier than the Start Date.");
      RuleFor(x => x.CredentialIssuanceEnabled)
         .Equal(false)
         .When(x => !x.VerificationEnabled)
         .WithMessage("Credential issuance cannot be enabled when verification is disabled.");
      RuleFor(x => x.SSISchemaName)
          .NotEmpty()
          .When(x => x.CredentialIssuanceEnabled)
          .WithMessage("SSI schema name is required when credential issuance is enabled.");
      RuleFor(x => x.SSISchemaName)
          .Must(SSISchemaExistsAndOfTypeOpportunity)
          .When(x => !string.IsNullOrEmpty(x.SSISchemaName))
          .WithMessage("SSI schema does not exist.");
      RuleFor(x => x.Categories).Must(categories => categories != null && categories.Count != 0 && categories.All(id => id != Guid.Empty && CategoryExists(id)))
        .WithMessage("Categories are required and must exist.");
      RuleFor(x => x.Countries).Must(countries => countries != null && countries.Count != 0 && countries.All(id => id != Guid.Empty && CountryExists(id)))
          .WithMessage("Countries are required and must exist.");
      RuleFor(x => x.Languages).Must(languages => languages != null && languages.Count != 0 && languages.All(id => id != Guid.Empty && LanguageExists(id)))
          .WithMessage("Languages are required and must exist.");
      RuleFor(x => x.Skills).Must(skills => skills != null && skills.All(id => id != Guid.Empty && SkillExists(id)))
          .WithMessage("Skills are optional, but must exist if specified.")
          .When(x => x.Skills != null && x.Skills.Count != 0);
      RuleFor(x => x.VerificationTypes)
          .Must(types => types != null && types.Count != 0)
          .When(x => x.VerificationMethod != null && x.VerificationMethod == VerificationMethod.Manual)
          .WithMessage("With manual verification, one or more verification types are required.");
      RuleFor(x => x.VerificationTypes)
          .Must(types => types == null || types.All(type => VerificationTypeExists(type.Type)))
          .WithMessage("Verification types must exist if specified.");
    }
    #endregion

    #region Private Members
    private bool TypeExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _opportunityTypeService.GetByIdOrNull(id) != null;
    }

    private bool DifficultyExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _opportunityDifficultyService.GetByIdOrNull(id) != null;
    }

    private bool TimeIntervalExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _timeIntervalService.GetByIdOrNull(id) != null;
    }

    private bool OrganizationUpdatable(Guid organizationId)
    {
      if (organizationId == Guid.Empty) return false;
      return _organizationService.Updatable(organizationId, false);
    }

    private bool ValidURL(string? url)
    {
      if (url == null) return true;
      return Uri.IsWellFormedUriString(url, UriKind.Absolute);
    }

    private static int CalculateCombinedLength(List<string> list)
    {
      if (list == null) return 0;

      return string.Join(OpportunityService.Keywords_Separator, list).Length;
    }

    private bool CategoryExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _opportunityCategoryService.GetByIdOrNull(id.Value) != null;
    }

    private bool CountryExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _countryService.GetByIdOrNull(id.Value) != null;
    }

    private bool LanguageExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _languageService.GetByIdOrNull(id.Value) != null;
    }

    private bool SkillExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _skillService.GetByIdOrNull(id.Value) != null;
    }

    private bool VerificationTypeExists(VerificationType type)
    {
      return _opportunityVerificationTypeService.GetByTypeOrNull(type) != null;
    }

    private bool SSISchemaExistsAndOfTypeOpportunity(string? name)
    {
      if (string.IsNullOrEmpty(name)) return false;
      var result = _ssiSchemaService.GetByFullNameOrNull(name).Result;

      return result != null && result.Type == SSI.Models.SchemaType.Opportunity;
    }
    #endregion
  }
}
