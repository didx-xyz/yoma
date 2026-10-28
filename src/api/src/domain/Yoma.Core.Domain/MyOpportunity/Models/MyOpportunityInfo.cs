using CsvHelper;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityInfo
  {
    [CsvIgnore]
    public Guid Id { get; set; }

    [CsvIgnore]
    public Guid UserId { get; set; }

    [CsvIgnore]
    public string Username { get; set; } = null!;

    [CsvColumn("Student Email")]
    public string? UserEmail { get; set; }

    [CsvColumn("Student Phone Number")]
    public string? UserPhoneNumer { get; set; }

    [CsvColumn("Student Display Name")]
    public string UserDisplayName { get; set; } = null!;

    [CsvColumn("Student Country")]
    public string? UserCountry { get; set; }

    [CsvIgnore]
    public string? UserEducation { get; set; }

    [CsvIgnore]
    public Guid? UserPhotoId { get; set; }

    [CsvIgnore]
    public string? UserPhotoURL { get; set; }

    [CsvIgnore]
    [JsonIgnore]
    public string? UserSettings { get; set; }

    [CsvIgnore]
    public Guid OpportunityId { get; set; }

    [CsvColumn("Opportunity Title")]
    public string OpportunityTitle { get; set; } = null!;

    [CsvIgnore]
    public string OpportunityDescription { get; set; } = null!;

    [CsvIgnore]
    public string? OpportunitySummary { get; set; }

    [CsvIgnore]
    public Opportunity.Type OpportunityType { get; set; }

    [CsvIgnore]
    public string? OpportunityCommitmentIntervalDescription { get; set; }

    #region Verification Counts
    [CsvIgnore]
    public int OpportunityParticipantCountTotal { get; set; }
    #endregion Verification Counts

    [CsvColumn("Opportunity Date Start")]
    public DateTimeOffset OpportunityDateStart { get; set; }

    [CsvColumn("Opportunity Date End")]
    public DateTimeOffset? OpportunityDateEnd { get; set; }

    [CsvIgnore]
    public Guid OrganizationId { get; set; }

    [CsvIgnore]
    public string OrganizationName { get; set; } = null!;

    [CsvIgnore]
    public string? OrganizationLogoURL { get; set; }

    [CsvIgnore]
    public Guid ActionId { get; set; }

    [CsvIgnore]
    public Action Action { get; set; }

    [CsvIgnore]
    public Guid? VerificationStatusId { get; set; }

    [CsvColumn("Status")]
    public VerificationStatus? VerificationStatus { get; set; }

    [CsvColumn("Comment")]
    public string? CommentVerification { get; set; }

    [CsvColumn("Completion Interval")]
    public Core.TimeIntervalOption? CommitmentInterval { get; set; }

    [CsvColumn("Completion Interval Count")]
    public short? CommitmentIntervalCount { get; set; }

    [CsvColumn("Date Start")]
    public DateTimeOffset? DateStart { get; set; }

    [CsvColumn("Date End")]
    public DateTimeOffset? DateEnd { get; set; }

    [CsvColumn("Percent Complete")]
    public decimal? PercentComplete { get; set; }

    [CsvColumn("Date Completed")]
    public DateTimeOffset? DateCompleted { get; set; }

    /// <summary>
    /// Captured participation or Entrepreneurship business location, not current Student Country or opportunity availability.
    /// Raw components support UI editing; CSV exports contain only Country Completed. Historical submissions are not backfilled.
    /// </summary>
    [CsvIgnore]
    public Guid? CountryId { get; set; }

    [CsvColumn("Country Completed")]
    public string? Country { get; set; }

    [CsvIgnore]
    public string? Region { get; set; }

    [CsvIgnore]
    public string? City { get; set; }

    [CsvIgnore]
    public string? Location { get; set; }

    [CsvColumn("Zlto Reward")]
    public decimal? ZltoReward { get; set; }

    [CsvIgnore]
    public bool? Recommendable { get; set; }

    [CsvIgnore]
    public byte? StarRating { get; set; }

    [CsvColumn("Feedback")]
    public string? Feedback { get; set; }

    [CsvColumn("Date Connected")]
    public DateTimeOffset DateModified { get; set; }

    [CsvIgnore]
    public SyncInfoMyOpportunity? SyncedInfo { get; set; }

    [JsonIgnore]
    [CsvColumn("Externally Managed (Locked)")]
    [CsvBooleanValues(CSVImportHelper.Boolean_Value_True, CSVImportHelper.Boolean_Value_False)]
    public bool SyncedLocked => SyncedInfo?.Locked == true;

    [JsonIgnore]
    [CsvColumn("Externally Managed By")]
    public string? SyncedPulled => SyncedInfo?.SyncType == Core.SyncType.Pull ? string.Join(", ", SyncedInfo.Partners) : null;

    [CsvIgnore]
    public List<MyOpportunityInfoVerification>? Verifications { get; set; }

    [CsvIgnore]
    public List<Skill>? Skills { get; set; }

    [JsonIgnore]
    [CsvColumn("Skills")]
    public string? SkillsFlattened => Skills == null || Skills.Count == 0 ? null : string.Join(", ", Skills.Select(o => o.Name));

    [CsvIgnore]
    public List<CustomFieldValueItem>? CustomFields { get; set; }

    [JsonIgnore]
    [CsvColumn("Custom Fields")]
    public string? CustomFieldsFlattened => CustomFields == null || CustomFields.Count == 0
      ? null
      : string.Join("; ", CustomFields.Select(o => o.DataType == Core.CustomFieldDataType.Option ? $"{o.Key}: {string.Join(", ", o.Values ?? [])}" : $"{o.Key}: {o.Value}"));
  }
}
