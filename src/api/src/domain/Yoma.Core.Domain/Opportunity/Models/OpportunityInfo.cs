using CsvHelper.Configuration.Attributes;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityInfo
  {
    [Ignore]
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public Type Type { get; set; }

    [Ignore]
    public Guid OrganizationId { get; set; }

    [Name("Organization Name")]
    public string OrganizationName { get; set; } = null!;

    [Ignore]
    public string? OrganizationLogoURL { get; set; }

    public string? Summary { get; set; }

    public string? Instructions { get; set; }

    public string? URL { get; set; }

    /// <summary>
    /// Informational provider; does not change the owning organisation or its permissions.
    /// </summary>
    public string? Provider { get; set; }

    /// <summary>
    /// Whether any incentive is offered. Null means not specified, not unpaid.
    /// </summary>
    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool? Incentivized { get; set; }

    /// <summary>
    /// Distinguishes Yoma ZLTO rewards from informational partner incentives.
    /// </summary>
    public RewardType RewardType { get; set; }

    /// <summary>
    /// Informational partner-funded amount; Yoma does not process this payment.
    /// </summary>
    public decimal? PartnerIncentiveAmount { get; set; }

    /// <summary>
    /// ISO 4217 currency code for the partner incentive. Not a ZLTO currency.
    /// </summary>
    public string? PartnerIncentiveCurrency { get; set; }

    /// <summary>
    /// Declared accessibility support; available accommodations describe the supported needs.
    /// </summary>
    public AccessibilitySupport? AccessibilitySupport { get; set; }

    /// <summary>
    /// Description required only when the Other accommodation is selected.
    /// </summary>
    public string? AccommodationOtherDescription { get; set; }

    /// <summary>
    /// Inclusive minimum age checked only on submission for verification using self-declared birth date.
    /// Browsing and finalization are not age-gated. Partner-reported verifications remain authoritative.
    /// </summary>
    public short? AgeFrom { get; set; }

    /// <summary>
    /// Inclusive maximum age; a missing birth date does not block participation.
    /// </summary>
    public short? AgeTo { get; set; }

    [Ignore]
    public List<Accessibility>? Accommodations { get; set; }

    [JsonIgnore]
    [Name("Accommodations")]
    public string? AccommodationsFlattened => Accommodations?.Count > 0 ? string.Join(CSVImportHelper.Value_Delimiter, Accommodations.Select(o => o.Name)) : null;

    [Ignore]
    public List<TargetedGroup>? TargetedGroups { get; set; }

    [JsonIgnore]
    [Name("TargetedGroups")]
    public string? TargetedGroupsFlattened => TargetedGroups?.Count > 0 ? string.Join(CSVImportHelper.Value_Delimiter, TargetedGroups.Select(o => o.Name)) : null;

    [Ignore]
    public List<SustainableDevelopmentGoal>? SustainableDevelopmentGoals { get; set; }

    [JsonIgnore]
    [Name("SustainableDevelopmentGoals")]
    public string? SustainableDevelopmentGoalsFlattened => SustainableDevelopmentGoals?.Count > 0 ? string.Join(CSVImportHelper.Value_Delimiter, SustainableDevelopmentGoals.Select(o => o.Number.ToString())) : null;

    [Name("Zlto Reward")]
    public decimal? ZltoReward { get; set; }

    [Ignore]
    public decimal? ZltoRewardEstimate { get; set; }

    [Name("Zlto Reward Cumulative")]
    public decimal? ZltoRewardCumulative { get; set; }

    [Name("Verification Enabled")]
    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool VerificationEnabled { get; set; }

    [Name("Verification Method")]
    public VerificationMethod? VerificationMethod { get; set; }

    [Ignore]
    public Core.TimeIntervalOption? CommitmentInterval { get; set; }

    [Ignore]
    public short? CommitmentIntervalCount { get; set; }

    [Name("Commitment Interval")]
    public string? CommitmentIntervalDescription { get; set; }

    [Ignore]
    public int? CommitmentIntervalTotalHours { get; set; }

    #region Engagement
    #region Verification Limits and Counts
    [Name("Participant Limit")]
    public int? ParticipantLimit { get; set; }

    [Name("Participant Count Completed")]
    public int ParticipantCountCompleted { get; set; }

    [Name("Participant Count Pending")]
    public int ParticipantCountPending { get; set; }

    [Name("Participant Count Total")]
    public int ParticipantCountTotal { get; set; }

    [Name("Participant Limit Reached")]
    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool ParticipantLimitReached { get; set; }
    #endregion Verification Limits and Counts

    [Name("Count Viewed")]
    public int CountViewed { get; set; }

    [Name("Count Got-To Clicks")]
    public int CountNavigatedExternalLink { get; set; }
    #endregion Engagement

    [Ignore]
    public Guid StatusId { get; set; }

    public Status Status { get; set; }

    [Ignore]
    public List<string>? Keywords { get; set; }

    [JsonIgnore]
    [Name("Keywords")]
    public string? KeywordsFlattened => Keywords == null || Keywords.Count == 0 ? null : string.Join(", ", Keywords);

    [Name("Start Date")]
    public DateTimeOffset DateStart { get; set; }

    [Name("End Date")]
    public DateTimeOffset? DateEnd { get; set; }

    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool Featured { get; set; }

    [Name("Engagement Type")]
    public Core.EngagementTypeOption? EngagementType { get; set; }

    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool ShareWithPartners { get; set; }

    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool Hidden { get; set; }

    [JsonIgnore]
    [Name("External Reference / ID")]
    public string? ExternalId { get; set; }

    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool Published { get; set; }

    [Ignore]
    public string YomaInfoURL { get; set; } = null!;

    [Ignore]
    public bool IsCompletable { get; set; }

    [Ignore]
    public string? NonCompletableReason { get; set; }

    [Ignore]
    public SyncInfoEntity? SyncedInfo { get; set; }

    [JsonIgnore]
    [Name("Externally Managed (Locked)")]
    [BooleanFalseValues(CSVImportHelper.Boolean_Value_False)]
    [BooleanTrueValues(CSVImportHelper.Boolean_Value_True)]
    public bool SyncedLocked => SyncedInfo?.Locked == true;

    [JsonIgnore]
    [Name("Externally Managed By")]
    public string? SyncedPulled => SyncedInfo?.SyncType == Core.SyncType.Pull ? string.Join(", ", SyncedInfo.Partners) : null;

    [JsonIgnore]
    [Name("Shared With")]
    public string? SyncedPushed => SyncedInfo?.SyncType == Core.SyncType.Push ? string.Join(", ", SyncedInfo.Partners) : null;

    [Ignore]
    public List<Lookups.OpportunityCategory>? Categories { get; set; }

    [JsonIgnore]
    [Name("Categories")]
    public string? CategoriesFlattened => Categories == null || Categories.Count == 0 ? null : string.Join(", ", Categories.Select(o => o.Name));

    [Ignore]
    public List<OpportunityCountryInfo>? Countries { get; set; }

    [JsonIgnore]
    [Name("Countries")]
    public string? CountriesFlattened => Countries == null || Countries.Count == 0 ? null : string.Join(", ", Countries.Select(o => o.Name));

    [Ignore]
    public List<Language>? Languages { get; set; }

    [JsonIgnore]
    [Name("Languages")]
    public string? LanguagesFlattened => Languages == null || Languages.Count == 0 ? null : string.Join(", ", Languages.Select(o => o.Name));

    [Ignore]
    public List<Skill>? Skills { get; set; }

    [JsonIgnore]
    [Name("Skills")]
    public string? SkillsFlattened => Skills == null || Skills.Count == 0 ? null : string.Join(", ", Skills.Select(o => o.Name));

    [Ignore]
    public List<Lookups.OpportunityVerificationType>? VerificationTypes { get; set; }

    [JsonIgnore]
    [Name("Verification Types")]
    public string? VerificationTypesFlattened => VerificationTypes == null || VerificationTypes.Count == 0 ? null : string.Join(", ", VerificationTypes.Select(o => o.Description));

    [Ignore]
    public List<CustomFieldValueItem>? CustomFields { get; set; }

    [JsonIgnore]
    [Name("Custom Fields")]
    public string? CustomFieldsFlattened => CustomFields == null || CustomFields.Count == 0
      ? null
      : string.Join("; ", CustomFields.Select(o => o.DataType == Core.CustomFieldDataType.Option ? $"{o.Key}: {string.Join(", ", o.Values ?? [])}" : $"{o.Key}: {o.Value}"));
  }
}
