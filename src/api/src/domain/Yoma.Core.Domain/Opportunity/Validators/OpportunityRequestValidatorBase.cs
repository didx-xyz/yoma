using FluentValidation;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;

namespace Yoma.Core.Domain.Opportunity.Validators
{
  public abstract class OpportunityRequestValidatorBase<TRequest> : AbstractValidator<TRequest>
        where TRequest : Models.OpportunityRequestBase
  {
    #region Class Variables
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOrganizationService _organizationService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly IEngagementTypeService _engagementTypeService;
    private readonly ITimeIntervalService _timeIntervalService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly ICountryService _countryService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
    private readonly ISSISchemaService _ssiSchemaService;
    #endregion

    #region Constructor
    public OpportunityRequestValidatorBase(IOpportunityTypeService opportunityTypeService,
        IOrganizationService organizationService,
        IOpportunityDifficultyService opportunityDifficultyService,
        IEngagementTypeService engagementTypeService,
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
      _engagementTypeService = engagementTypeService;
      _timeIntervalService = timeIntervalService;
      _opportunityCategoryService = opportunityCategoryService;
      _countryService = countryService;
      _languageService = languageService;
      _skillService = skillService;
      _opportunityVerificationTypeService = opportunityVerificationTypeService;
      _ssiSchemaService = ssiSchemaService;

      RuleFor(x => x.Title)
          .NotEmpty()
          .Length(1, 150)
          .WithMessage("Title is required and must be between 1 and 150 characters long.");

      RuleFor(x => x.Description)
          .NotEmpty();

      RuleFor(x => x.TypeId)
          .NotEmpty()
          .Must(TypeExists)
          .WithMessage("Opportunity type is invalid or does not exist.");

      RuleFor(x => x.OrganizationId)
          .NotEmpty()
          .Must(OrganizationActive)
          .WithMessage("The selected organization is either invalid or inactive.");

      RuleFor(x => x.Summary)
          .NotEmpty()
          .Length(1, 150)
          .WithMessage("Summary is required and must be between 1 and 150 characters.");

      // Instructions are auto trimmed

      RuleFor(x => x.URL)
          .Length(1, 2048)
          .Must(ValidURL)
          .When(x => !string.IsNullOrEmpty(x.URL))
          .WithMessage("URL must be between 1 and 2048 characters long and be a valid URL if specified.");

      RuleFor(x => x.ZltoReward)
          .GreaterThan(0)
          .When(x => x.ZltoReward.HasValue)
          .WithMessage("ZLTO reward must be greater than 0.")
          .LessThanOrEqualTo(2000)
          .When(x => x.ZltoReward.HasValue)
          .WithMessage("ZLTO reward must be less than or equal to 2000.")
          .Must(zltoReward => zltoReward % 1 == 0)
          .When(x => x.ZltoReward.HasValue)
          .WithMessage("ZLTO reward does not support decimal points.");

      RuleFor(x => x.YomaReward)
          .GreaterThan(0)
          .When(x => x.YomaReward.HasValue)
          .WithMessage("Yoma reward must be greater than 0.")
          .LessThanOrEqualTo(2000)
          .When(x => x.YomaReward.HasValue)
          .WithMessage("Yoma reward must be less than or equal to 2000.");

      RuleFor(x => x.ZltoRewardPool)
          .GreaterThan(0)
          .When(x => x.ZltoRewardPool.HasValue)
          .WithMessage("ZLTO reward pool must be greater than 0.")
          .Must((model, zltoRewardPool) => !model.ZltoRewardPool.HasValue || (model.ZltoReward.HasValue && zltoRewardPool >= model.ZltoReward))
          .WithMessage("ZLTO reward pool must be greater than or equal to ZLTO reward.")
          .LessThanOrEqualTo(10000000M)
          .When(x => x.ZltoRewardPool.HasValue)
          .WithMessage("ZLTO reward pool must not exceed 10 million.")
          .Must(zltoRewardPool => zltoRewardPool % 1 == 0)
          .When(x => x.ZltoRewardPool.HasValue)
          .WithMessage("ZLTO reward pool does not support decimal points.");

      RuleFor(x => x.YomaRewardPool)
          .GreaterThan(0)
          .When(x => x.YomaRewardPool.HasValue)
          .WithMessage("Yoma reward pool must be greater than 0.")
          .Must((model, yomaRewardPool) => !model.YomaRewardPool.HasValue || (model.YomaReward.HasValue && yomaRewardPool >= model.YomaReward))
          .WithMessage("Yoma reward pool must be greater than or equal to Yoma reward.")
          .LessThanOrEqualTo(10000000M)
          .When(x => x.YomaRewardPool.HasValue)
          .WithMessage("Yoma reward pool must not exceed 10 million.");

      RuleFor(x => x.VerificationMethod)
          .NotNull()
          .When(x => x.VerificationEnabled)
          .WithMessage("A verification method is required when verification is enabled.");

      // Difficulty is required except for Job opportunities If specified it must exist
      RuleFor(x => x.DifficultyId)
          .Cascade(CascadeMode.Stop)
          .Must((model, difficultyId) =>
          {
            if (!TypeExists(model.TypeId)) return true;

            return TypeIsJob(model.TypeId) || difficultyId.HasValue;
          })
          .WithMessage("Difficulty is required.")
          .Must(difficultyId => DifficultyExists(difficultyId))
          .WithMessage("Specified difficulty is invalid or does not exist.");

      // Commitment interval is required except for Job opportunities If specified it must exist
      RuleFor(x => x.CommitmentIntervalId)
          .Cascade(CascadeMode.Stop)
          .Must((model, intervalId) =>
          {
            if (!TypeExists(model.TypeId)) return true;

            var isJob = TypeIsJob(model.TypeId);
            return isJob
              ? intervalId.HasValue == model.CommitmentIntervalCount.HasValue
              : intervalId.HasValue;
          })
          .WithMessage("Commitment interval is required.")
          .Must(intervalId => !intervalId.HasValue || TimeIntervalExists(intervalId))
          .WithMessage("Specified time interval is invalid or does not exist.");

      // Commitment interval count is required except for Job opportunities
      RuleFor(x => x.CommitmentIntervalCount)
          .Cascade(CascadeMode.Stop)
          .Must((model, count) =>
          {
            if (!TypeExists(model.TypeId)) return true;

            var isJob = TypeIsJob(model.TypeId);
            return isJob
              ? count.HasValue == model.CommitmentIntervalId.HasValue
              : count.HasValue;
          })
          .WithMessage("Commitment interval count is required.")
          .Must(count => !count.HasValue || count > 0)
          .WithMessage("Commitment interval count must be greater than 0.");

      RuleFor(x => x.ParticipantLimit)
          .Must(o => !o.HasValue)
          .When(x => !x.VerificationEnabled)
          .WithMessage("Participant limit is not supported when verification is not enabled. Please remove the specified value.");

      RuleFor(x => x.ParticipantLimit)
          .Must(x => x > 0)
          .When(x => x.ParticipantLimit.HasValue)
          .WithMessage("Participant limit must be greater than 0.");

      RuleFor(x => x.Keywords)
          .Must(keywords => keywords == null || keywords.All(x => !string.IsNullOrWhiteSpace(x) && !x.Contains(OpportunityService.Keywords_Separator)))
          .WithMessage("Keywords contain empty values or keywords with the ',' character.");

      RuleFor(model => model.Keywords)
          .Must(list => list == null || CalculateCombinedLength(list) >= 1 && CalculateCombinedLength(list) <= OpportunityService.Keywords_CombinedMaxLength)
          .WithMessage("The combined length of keywords must be between 1 and 500 characters.");

      // Backdated opportunities are allowed
      RuleFor(x => x.DateStart)
          .NotEmpty();

      // End date can be in the past
      RuleFor(model => model.DateEnd)
          .GreaterThanOrEqualTo(model => model.DateStart)
          .When(model => model.DateEnd.HasValue)
          .WithMessage("End date cannot be earlier than the start date.");

      RuleFor(x => x.CredentialIssuanceEnabled)
          .Equal(false)
          .When(x => !x.VerificationEnabled)
          .WithMessage("Credential issuance cannot be enabled when verification is disabled.");

      RuleFor(x => x.CredentialIssuanceEnabled)
          .Equal(true)
          .When(x => x.VerificationEnabled)
          .WithMessage("Credential issuance is required when verification is enabled.");

      RuleFor(x => x.SSISchemaName)
          .NotEmpty()
          .When(x => x.CredentialIssuanceEnabled)
          .WithMessage("SSI schema name is required when credential issuance is enabled.");

      RuleFor(x => x.SSISchemaName)
          .Must(SSISchemaExistsAndOfTypeOpportunity)
          .When(x => !string.IsNullOrEmpty(x.SSISchemaName))
          .WithMessage("SSI schema does not exist.");

      // Engagement type is optional. If specified it must exist.
      RuleFor(x => x.EngagementTypeId)
        .Must(EngagementTypeExists)
        .WithMessage("Specified engagement type is invalid or does not exist.");

      RuleFor(x => x.Categories)
          .Must(categories => categories != null && categories.Count != 0 && categories.All(id => id != Guid.Empty && CategoryExists(id)))
          .WithMessage("Categories are required and must exist.");

      RuleFor(x => x.Countries)
          .Must(countries => countries != null && countries.Count != 0 && countries.All(id => id != Guid.Empty && CountryExists(id)))
          .WithMessage("Countries are required and must exist.");

      RuleFor(x => x.Languages)
          .Must(languages => languages != null && languages.Count != 0 && languages.All(id => id != Guid.Empty && LanguageExists(id)))
          .WithMessage("Languages are required and must exist.");

      // Skills are optional. If specified they must exist.
      RuleFor(x => x.Skills)
          .Must(skills => skills != null && skills.All(id => id != Guid.Empty && SkillExists(id)))
          .WithMessage("Skills are optional, but must exist if specified.")
          .When(x => x.Skills != null && x.Skills.Count != 0);

      RuleFor(x => x.VerificationTypes)
          .Must(types => types != null && types.Count != 0)
          .When(x => x.VerificationMethod != null && x.VerificationMethod == VerificationMethod.Manual)
          .WithMessage("With manual verification, one or more verification types are required.");

      RuleFor(x => x.VerificationTypes)
          .Must(types => types == null || types.All(type => VerificationTypeExists(type.Type)))
          .WithMessage("Verification types must exist if specified.");

      // Shared opportunities cannot be hidden
      RuleFor(opportunity => opportunity.Hidden)
          .Must((opportunity, hidden) => hidden != true || opportunity.ShareWithPartners != true)
          .WithMessage("An opportunity shared with partners cannot be flagged as hidden.");

      // Hidden opportunities cannot be shared with partners
      RuleFor(opportunity => opportunity.ShareWithPartners)
          .Must((opportunity, shareWithPartners) => shareWithPartners != true || opportunity.Hidden != true)
          .WithMessage("A hidden opportunity cannot be shared with partners.");
    }
    #endregion

    #region Private Members
    private bool TypeExists(Guid id)
    {
      if (id == Guid.Empty) return false;
      return _opportunityTypeService.GetByIdOrNull(id) != null;
    }

    private bool TypeIsJob(Guid typeId)
    {
      if (typeId == Guid.Empty) return false;

      var type = _opportunityTypeService.GetByIdOrNull(typeId);
      return type != null && type.Name.Equals(Type.Job.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private bool DifficultyExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _opportunityDifficultyService.GetByIdOrNull(id.Value) != null;
    }

    private bool TimeIntervalExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _timeIntervalService.GetByIdOrNull(id.Value) != null;
    }

    private bool OrganizationActive(Guid organizationId)
    {
      if (organizationId == Guid.Empty) return false;
      var organization = _organizationService.GetByIdOrNull(organizationId, false, false, false);
      return organization != null && organization.Status == Entity.OrganizationStatus.Active;
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

      return result != null && result.Type == SchemaType.Opportunity;
    }

    private bool EngagementTypeExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _engagementTypeService.GetByIdOrNull(id.Value) != null;
    }
    #endregion
  }
}
