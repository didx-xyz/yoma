using CsvHelper;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityInfo
  {
    [CsvIgnore]
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public Type Type { get; set; }

    [CsvIgnore]
    public Guid OrganizationId { get; set; }

    [CsvColumn("Organization Name")]
    public string OrganizationName { get; set; } = null!;

    [CsvIgnore]
    public string? OrganizationLogoURL { get; set; }

    public string? Summary { get; set; }

    public string? Instructions { get; set; }

    public string? URL { get; set; }

    /// <summary>
    /// Informational provider; does not change the owning organisation or its permissions.
    /// </summary>
    public string? Provider { get; set; }

    /// <summary>
    /// Optional provider website, distinct from the opportunity's action link.
    /// </summary>
    [CsvIgnore]
    public string? ProviderURL { get; set; }

    /// <summary>
    /// Optional provider logo image URL, distinct from the provider's website and owning organisation's logo.
    /// </summary>
    [CsvIgnore]
    public string? ProviderLogoURL { get; set; }

    /// <summary>
    /// Optional provider origin for discovery, never availability or the youth's participation/business location.
    /// Must be a specific country; Worldwide is not a provider origin.
    /// </summary>
    [CsvIgnore]
    public Guid? ProviderCountryId { get; set; }

    [CsvIgnore]
    public string? ProviderCountry { get; set; }

    /// <summary>
    /// Whether any incentive is offered. Null means not specified, not unpaid.
    /// </summary>
    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
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

    [CsvIgnore]
    public List<Accessibility>? Accommodations { get; set; }

    [JsonIgnore]
    [CsvColumn("Accommodations")]
    public string? AccommodationsFlattened => Accommodations?.Count > 0 ? string.Join(CSVImportHelper.Value_Delimiter, Accommodations.Select(o => o.Name)) : null;

    [CsvIgnore]
    public List<TargetedGroup>? TargetedGroups { get; set; }

    [JsonIgnore]
    [CsvColumn("TargetedGroups")]
    public string? TargetedGroupsFlattened => TargetedGroups?.Count > 0 ? string.Join(CSVImportHelper.Value_Delimiter, TargetedGroups.Select(o => o.Name)) : null;

    [CsvIgnore]
    public List<SustainableDevelopmentGoal>? SustainableDevelopmentGoals { get; set; }

    [JsonIgnore]
    [CsvColumn("SustainableDevelopmentGoals")]
    public string? SustainableDevelopmentGoalsFlattened => SustainableDevelopmentGoals?.Count > 0 ? string.Join(CSVImportHelper.Value_Delimiter, SustainableDevelopmentGoals.Select(o => o.Number.ToString())) : null;

    [CsvColumn("Zlto Reward")]
    public decimal? ZltoReward { get; set; }

    [CsvIgnore]
    public decimal? ZltoRewardEstimate { get; set; }

    [CsvColumn("Zlto Reward Cumulative")]
    public decimal? ZltoRewardCumulative { get; set; }

    [CsvColumn("Verification Enabled")]
    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool VerificationEnabled { get; set; }

    [CsvColumn("Verification Method")]
    public VerificationMethod? VerificationMethod { get; set; }

    [CsvIgnore]
    public Core.TimeIntervalOption? CommitmentInterval { get; set; }

    [CsvIgnore]
    public short? CommitmentIntervalCount { get; set; }

    [CsvColumn("Commitment Interval")]
    public string? CommitmentIntervalDescription { get; set; }

    [CsvIgnore]
    public int? CommitmentIntervalTotalHours { get; set; }

    #region Engagement
    #region Verification Limits and Counts
    [CsvColumn("Participant Limit")]
    public int? ParticipantLimit { get; set; }

    [CsvColumn("Participant Count Completed")]
    public int ParticipantCountCompleted { get; set; }

    [CsvColumn("Participant Count Pending")]
    public int ParticipantCountPending { get; set; }

    [CsvColumn("Participant Count Total")]
    public int ParticipantCountTotal { get; set; }

    [CsvColumn("Participant Limit Reached")]
    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool ParticipantLimitReached { get; set; }
    #endregion Verification Limits and Counts

    [CsvColumn("Count Viewed")]
    public int CountViewed { get; set; }

    [CsvColumn("Count Got-To Clicks")]
    public int CountNavigatedExternalLink { get; set; }
    #endregion Engagement

    [CsvIgnore]
    public Guid StatusId { get; set; }

    public Status Status { get; set; }

    [CsvIgnore]
    public List<string>? Keywords { get; set; }

    [JsonIgnore]
    [CsvColumn("Keywords")]
    public string? KeywordsFlattened => Keywords == null || Keywords.Count == 0 ? null : string.Join(", ", Keywords);

    [CsvColumn("Start Date")]
    public DateTimeOffset DateStart { get; set; }

    [CsvColumn("End Date")]
    public DateTimeOffset? DateEnd { get; set; }

    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool Featured { get; set; }

    [CsvColumn("Engagement Type")]
    public Core.EngagementTypeOption? EngagementType { get; set; }

    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool ShareWithPartners { get; set; }

    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool Hidden { get; set; }

    [JsonIgnore]
    [CsvColumn("External Reference / ID")]
    public string? ExternalId { get; set; }

    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool Published { get; set; }

    [CsvIgnore]
    public string YomaInfoURL { get; set; } = null!;

    [CsvIgnore]
    public bool IsCompletable { get; set; }

    [CsvIgnore]
    public string? NonCompletableReason { get; set; }

    [CsvIgnore]
    public SyncInfoEntity? SyncedInfo { get; set; }

    [JsonIgnore]
    [CsvColumn("Externally Managed (Locked)")]
    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool SyncedLocked => SyncedInfo?.Locked == true;

    [JsonIgnore]
    [CsvColumn("Externally Managed By")]
    public string? SyncedPulled => SyncedInfo?.SyncType == Core.SyncType.Pull ? string.Join(", ", SyncedInfo.Partners) : null;

    [JsonIgnore]
    [CsvColumn("Shared With")]
    public string? SyncedPushed => SyncedInfo?.SyncType == Core.SyncType.Push ? string.Join(", ", SyncedInfo.Partners) : null;

    [CsvIgnore]
    public List<Lookups.OpportunityCategory>? Categories { get; set; }

    [JsonIgnore]
    [CsvColumn("Categories")]
    public string? CategoriesFlattened => Categories == null || Categories.Count == 0 ? null : string.Join(", ", Categories.Select(o => o.Name));

    [CsvIgnore]
    public List<OpportunityCountryInfo>? Countries { get; set; }

    [JsonIgnore]
    [CsvColumn("Countries")]
    public string? CountriesFlattened => Countries == null || Countries.Count == 0 ? null : string.Join(", ", Countries.Select(o => o.Name));

    [CsvIgnore]
    public List<Language>? Languages { get; set; }

    [JsonIgnore]
    [CsvColumn("Languages")]
    public string? LanguagesFlattened => Languages == null || Languages.Count == 0 ? null : string.Join(", ", Languages.Select(o => o.Name));

    [CsvIgnore]
    public List<Skill>? Skills { get; set; }

    [JsonIgnore]
    [CsvColumn("Skills")]
    public string? SkillsFlattened => Skills == null || Skills.Count == 0 ? null : string.Join(", ", Skills.Select(o => o.Name));

    [CsvIgnore]
    public List<Lookups.OpportunityVerificationType>? VerificationTypes { get; set; }

    [JsonIgnore]
    [CsvColumn("Verification Types")]
    public string? VerificationTypesFlattened => VerificationTypes == null || VerificationTypes.Count == 0 ? null : string.Join(", ", VerificationTypes.Select(o => o.Description));

    [CsvIgnore]
    public List<CustomFieldValueItem>? CustomFields { get; set; }

    [JsonIgnore]
    [CsvColumn("Custom Fields")]
    public string? CustomFieldsFlattened => CustomFields == null || CustomFields.Count == 0
      ? null
      : string.Join("; ", CustomFields.Select(o => o.DataType == Core.CustomFieldDataType.Option ? $"{o.Key}: {string.Join(", ", o.Values ?? [])}" : $"{o.Key}: {o.Value}"));
  }
}
