using FluentValidation;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Services;

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
        OpportunityRequestCountryValidator opportunityRequestCountryValidator,
        ICurrencyService currencyService,
        IAccessibilityService accessibilityService,
        ITargetedGroupService targetedGroupService,
        ISustainableDevelopmentGoalService sustainableDevelopmentGoalService)
    {
      ArgumentNullException.ThrowIfNull(opportunityRequestCountryValidator);
      ArgumentNullException.ThrowIfNull(currencyService);
      ArgumentNullException.ThrowIfNull(accessibilityService);
      ArgumentNullException.ThrowIfNull(targetedGroupService);
      ArgumentNullException.ThrowIfNull(sustainableDevelopmentGoalService);
      _opportunityTypeService = opportunityTypeService ?? throw new ArgumentNullException(nameof(opportunityTypeService));
      _organizationService = organizationService ?? throw new ArgumentNullException(nameof(organizationService));
      _opportunityDifficultyService = opportunityDifficultyService ?? throw new ArgumentNullException(nameof(opportunityDifficultyService));
      _engagementTypeService = engagementTypeService ?? throw new ArgumentNullException(nameof(engagementTypeService));
      _timeIntervalService = timeIntervalService ?? throw new ArgumentNullException(nameof(timeIntervalService));
      _opportunityCategoryService = opportunityCategoryService ?? throw new ArgumentNullException(nameof(opportunityCategoryService));
      _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
      _languageService = languageService ?? throw new ArgumentNullException(nameof(languageService));
      _skillService = skillService ?? throw new ArgumentNullException(nameof(skillService));
      _opportunityVerificationTypeService = opportunityVerificationTypeService ?? throw new ArgumentNullException(nameof(opportunityVerificationTypeService));

      RuleFor(x => x.Title)
          .NotEmpty()
          .Length(1, OpportunityService.Title_MaxLength)
          .WithMessage($"Title is required and must be between 1 and {OpportunityService.Title_MaxLength} characters long.");

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
          .Length(1, OpportunityService.Summary_MaxLength)
          .WithMessage($"Summary is required and must be between 1 and {OpportunityService.Summary_MaxLength} characters.");

      // Instructions are auto trimmed

      RuleFor(x => x.URL)
          .Length(1, 2048)
          .Must(ValidURL)
          .When(x => !string.IsNullOrEmpty(x.URL))
          .WithMessage("URL must be between 1 and 2048 characters long and be a valid URL if specified.");

      RuleFor(x => x.Provider)
          .MaximumLength(OpportunityService.Provider_MaxLength);

      // Manual capture must make an explicit selection. Import and sync may preserve unknown values.
      RuleSet("Manual", () =>
      {
        RuleFor(x => x.Incentivized)
            .NotNull()
            .WithMessage("An incentivized selection is required.");
      });

      RuleFor(x => x.Incentivized)
          .Must((request, value) => value != false || request.RewardType == RewardType.None)
          .WithMessage("An opportunity offering a reward cannot be marked as not incentivized.")
          .Must((request, value) => TypeIsJob(request.TypeId) || request.RewardType == RewardType.None || value == true)
          .WithMessage("A rewarded non-Job opportunity must be marked as incentivized.");

      RuleFor(x => x.RewardType)
          .IsInEnum()
          .Must((request, value) => !TypeIsJob(request.TypeId) ||
          value != RewardType.ZLTO && !request.ZltoReward.HasValue && !request.ZltoRewardPool.HasValue)
          .WithMessage("Jobs do not support ZLTO rewards.")
          .Must((request, value) => TypeIsJob(request.TypeId) || request.Incentivized != true || value != RewardType.None)
          .WithMessage("An incentivized non-Job opportunity requires a reward type.");

      RuleFor(x => x.PartnerIncentiveAmount)
          .Must((request, value) => request.RewardType == RewardType.PartnerIncentive ? value > 0 : value == null)
          .WithMessage("A positive partner incentive amount is required only for reward type PartnerIncentive.")
          .LessThan(100000000000000m)
          .PrecisionScale(18, 4, true);

      RuleFor(x => x.PartnerIncentiveCurrency)
          .Must((request, value) => request.RewardType == RewardType.PartnerIncentive
          ? currencyService.List().Any(o => o.Code == value)
          : value == null)
          .WithMessage("A valid ISO currency code is required only for reward type PartnerIncentive.");

      RuleFor(x => x.AccessibilitySupport)
          .IsInEnum()
          .When(x => x.AccessibilitySupport.HasValue);

      RuleFor(x => x.AccommodationOtherDescription)
          .MaximumLength(OpportunityService.AccommodationOtherDescription_MaxLength)
          .Must((request, value) =>
        {
          var other = accessibilityService.List().SingleOrDefault(o => o.Name == AccessibilityOption.Other.ToString());
          var hasOther = other != null && request.Accommodations?.Contains(other.Id) == true;
          return hasOther == !string.IsNullOrWhiteSpace(value);
        })
          .WithMessage("Other description must be provided only when Other is selected.");

      RuleFor(x => x.AgeFrom)
          .GreaterThanOrEqualTo((short)0);

      RuleFor(x => x.AgeTo)
          .GreaterThanOrEqualTo((short)0)
          .Must((request, value) => !request.AgeFrom.HasValue || !value.HasValue || value >= request.AgeFrom)
          .WithMessage("To age must be greater than or equal to from age.");

      RuleFor(x => x.Accommodations)
          .Must(values => values == null || values.All(id => accessibilityService.List().Any(o => o.Id == id)))
          .WithMessage("Specified accommodation does not exist.")
          .Must((request, values) => request.AccessibilitySupport != AccessibilitySupport.Yes || values?.Count > 0)
          .WithMessage("Accessibility support Yes requires at least one accommodation.")
          .Must((request, values) => !(values?.Count > 0) ||
          request.AccessibilitySupport is AccessibilitySupport.Yes or AccessibilitySupport.AvailableOnRequest)
          .WithMessage("Accommodations require accessibility support Yes or AvailableOnRequest.");

      RuleFor(x => x.TargetedGroups)
          .Must(values => values == null || values.All(id => targetedGroupService.List().Any(o => o.Id == id)))
          .WithMessage("Specified targeted group does not exist.")
          .Must(values =>
        {
          var openToAll = targetedGroupService.List().SingleOrDefault(o => o.Name == TargetedGroupOption.OpenToAll.ToDescription());
          return openToAll == null || values?.Contains(openToAll.Id) != true || values.Distinct().Count() == 1;
        })
          .WithMessage("Open to all cannot be combined with another targeted group.");

      RuleFor(x => x.SustainableDevelopmentGoals)
          .Must(values => values == null || values.All(id => sustainableDevelopmentGoalService.List().Any(o => o.Id == id)))
          .WithMessage("Specified Sustainable Development Goal does not exist.");

      RuleFor(x => x.ZltoReward)
          .Must((request, value) => request.RewardType == RewardType.ZLTO ? value.HasValue : !value.HasValue)
          .WithMessage("ZLTO reward is required only for reward type ZLTO.");

      RuleFor(x => x.ZltoRewardPool)
          .Must((request, value) => request.RewardType == RewardType.ZLTO || !value.HasValue)
          .WithMessage("ZLTO reward pool is only supported for reward type ZLTO.");

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


      // Engagement type is optional. If specified it must exist.
      RuleFor(x => x.EngagementTypeId)
          .Must(EngagementTypeExists)
          .WithMessage("Specified engagement type is invalid or does not exist.");

      RuleFor(x => x.Categories)
          .Must(categories => categories != null && categories.Count != 0 && categories.All(id => id != Guid.Empty && CategoryExists(id)))
          .WithMessage("Categories are required and must exist.");

      RuleFor(x => x.Countries)
          .Must(countries => countries != null && countries.Count != 0 && countries.All(o => o != null && o.CountryId != Guid.Empty && CountryExists(o.CountryId)))
          .WithMessage("Countries are required and must exist.");

      RuleFor(x => x.Countries)
          .Must(locations => locations == null ||
        locations.All(o => o != null) && locations.Select(o => o.CountryId).Distinct().Count() == locations.Count)
          .WithMessage("Locations must contain one non-empty entry per country.");

      RuleForEach(x => x.Countries)
          .SetValidator(opportunityRequestCountryValidator);

      RuleFor(x => x.Languages)
          .Must(languages => languages != null && languages.Count != 0 && languages.All(id => id != Guid.Empty && LanguageExists(id)))
          .WithMessage("Languages are required and must exist.");

      // Skills are optional. If specified, all skills must exist.
      RuleFor(x => x.Skills)
          .Must(skills => skills == null || skills.All(id => id != Guid.Empty && SkillExists(id)))
          .WithMessage("Skills are optional, but must exist if specified.");

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

      RuleFor(x => x.ExternalId)
          .MaximumLength(OpportunityService.ExternalId_MaxLength)
          .When(x => !string.IsNullOrEmpty(x.ExternalId))
          .WithMessage($"External ID must not exceed {OpportunityService.ExternalId_MaxLength} characters.");

      // Hidden opportunities cannot be shared with partners
      RuleFor(opportunity => opportunity.ShareWithPartners)
          .Must((opportunity, shareWithPartners) => shareWithPartners != true || opportunity.Hidden != true)
          .WithMessage("A hidden opportunity cannot be shared with partners.");

      RuleFor(x => x.CustomFields)
          .Must(CustomFieldKeysUnique)
          .WithMessage("Custom field keys must be unique.");

      RuleForEach(x => x.CustomFields)
          .ChildRules(field =>
      {
        field.RuleFor(x => x.Key)
            .NotEmpty()
            .WithMessage("Custom field key is required.");

        field.RuleFor(x => x)
            .Must(CustomFieldValueSpecified)
            .WithMessage("Custom field must specify exactly one of value or values; values must contain at least one item.");

        field.RuleFor(x => x.Value)
            .Must(value => string.IsNullOrWhiteSpace(value) || !value.Contains(CustomFieldValue.Value_Delimiter))
            .WithMessage("Custom field value contains an invalid delimiter character.");

        field.RuleFor(x => x.Values)
            .Must(values => values == null || values.All(value => !string.IsNullOrWhiteSpace(value) && !value.Contains(CustomFieldValue.Value_Delimiter)))
            .WithMessage("Custom field values contain empty values or invalid delimiter characters.");
      });
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

    private bool EngagementTypeExists(Guid? id)
    {
      if (!id.HasValue) return true;
      if (id.Value == Guid.Empty) return false;
      return _engagementTypeService.GetByIdOrNull(id.Value) != null;
    }

    private static bool CustomFieldKeysUnique(List<CustomFieldValueRequest>? customFields)
    {
      if (customFields == null) return true;

      var keys = customFields
        .Where(o => !string.IsNullOrWhiteSpace(o.Key))
        .Select(o => o.Key.Trim())
        .ToList();

      return keys.Count == keys.Distinct(StringComparer.OrdinalIgnoreCase).Count();
    }

    private static bool CustomFieldValueSpecified(CustomFieldValueRequest customField)
    {
      var hasValue = !string.IsNullOrWhiteSpace(customField.Value);
      var hasValues = customField.Values != null;

      // PATCH normalizes a key-only item into an explicit deletion. It is valid only
      // when neither scalar nor option values were supplied with the deletion request.
      if (customField.Delete)
        return !hasValue && (!hasValues || customField.Values!.Count == 0);

      // A normal item must use exactly one value representation: Value for scalar
      // fields or a non-empty Values collection for option fields.
      return hasValue != hasValues && (!hasValues || customField.Values!.Count != 0);
    }
    #endregion
  }
}
