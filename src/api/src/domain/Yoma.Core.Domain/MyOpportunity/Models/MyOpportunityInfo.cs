using CsvHelper.Configuration.Attributes;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.MyOpportunity.Models
{
  public class MyOpportunityInfo
  {
    [Ignore]
    public Guid Id { get; set; }

    [Ignore]
    public Guid UserId { get; set; }

    [Ignore]
    public string Username { get; set; } = null!;

    [Name("Student Email")]
    public string? UserEmail { get; set; }

    [Name("Student Phone Number")]
    public string? UserPhoneNumer { get; set; }

    [Name("Student Display Name")]
    public string UserDisplayName { get; set; } = null!;

    [Name("Student Country")]
    public string? UserCountry { get; set; }

    [Ignore]
    public string? UserEducation { get; set; }

    [Ignore]
    public Guid? UserPhotoId { get; set; }

    [Ignore]
    public string? UserPhotoURL { get; set; }

    [Ignore]
    [JsonIgnore]
    public string? UserSettings { get; set; }

    [Ignore]
    public Guid OpportunityId { get; set; }

    [Name("Opportunity Title")]
    public string OpportunityTitle { get; set; } = null!;

    [Ignore]
    public string OpportunityDescription { get; set; } = null!;

    [Ignore]
    public string? OpportunitySummary { get; set; }

    [Ignore]
    public Opportunity.Type OpportunityType { get; set; }

    [Ignore]
    public string? OpportunityCommitmentIntervalDescription { get; set; }

    #region Verification Counts
    [Ignore]
    public int OpportunityParticipantCountTotal { get; set; }
    #endregion Verification Counts

    [Name("Opportunity Date Start")]
    public DateTimeOffset OpportunityDateStart { get; set; }

    [Name("Opportunity Date End")]
    public DateTimeOffset? OpportunityDateEnd { get; set; }

    [Ignore]
    public Guid OrganizationId { get; set; }

    [Ignore]
    public string OrganizationName { get; set; } = null!;

    [Ignore]
    public string? OrganizationLogoURL { get; set; }

    [Ignore]
    public Guid ActionId { get; set; }

    [Ignore]
    public Action Action { get; set; }

    [Ignore]
    public Guid? VerificationStatusId { get; set; }

    [Name("Status")]
    public VerificationStatus? VerificationStatus { get; set; }

    [Name("Comment")]
    public string? CommentVerification { get; set; }

    [Name("Completion Interval")]
    public Core.TimeIntervalOption? CommitmentInterval { get; set; }

    [Name("Completion Interval Count")]
    public short? CommitmentIntervalCount { get; set; }

    [Name("Date Start")]
    public DateTimeOffset? DateStart { get; set; }

    [Name("Date End")]
    public DateTimeOffset? DateEnd { get; set; }

    [Name("Percent Complete")]
    public decimal? PercentComplete { get; set; }

    [Name("Date Completed")]
    public DateTimeOffset? DateCompleted { get; set; }

    [Name("Zlto Reward")]
    public decimal? ZltoReward { get; set; }

    [Ignore] //reserved for future use
    public decimal? YomaReward { get; set; }

    [Ignore]
    public bool? Recommendable { get; set; }

    [Ignore]
    public byte? StarRating { get; set; }

    [Name("Feedback")]
    public string? Feedback { get; set; }

    [Name("Date Connected")]
    public DateTimeOffset DateModified { get; set; }

    [Ignore]
    public SyncInfoMyOpportunity? SyncedInfo { get; set; }

    [JsonIgnore]
    [Name("Externally Managed (Locked)")]
    [BooleanFalseValues("No")]
    [BooleanTrueValues("Yes")]
    public bool SyncedLocked => SyncedInfo?.Locked == true;

    [JsonIgnore]
    [Name("Externally Managed By")]
    public string? SyncedPulled => SyncedInfo?.SyncType == Core.SyncType.Pull ? string.Join(", ", SyncedInfo.Partners) : null;

    [Ignore]
    public List<MyOpportunityInfoVerification>? Verifications { get; set; }

    [Ignore]
    public List<Skill>? Skills { get; set; }

    [JsonIgnore]
    [Name("Skills")]
    public string? SkillsFlattened => Skills == null || Skills.Count == 0 ? null : string.Join(", ", Skills.Select(o => o.Name));

    [Ignore]
    public List<CustomFieldValueItem>? CustomFields { get; set; }

    [JsonIgnore]
    [Name("Custom Fields")]
    public string? CustomFieldsFlattened => CustomFields == null || CustomFields.Count == 0
      ? null
      : string.Join("; ", CustomFields.Select(o => o.DataType == Core.CustomFieldDataType.Option ? $"{o.Key}: {string.Join(", ", o.Values ?? [])}" : $"{o.Key}: {o.Value}"));
  }
}
