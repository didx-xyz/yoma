using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Opportunity.Extensions;
using Yoma.Core.Domain.PartnerSync.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class Opportunity
  {
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public Guid TypeId { get; set; }

    public string Type { get; set; } = null!;

    public Guid OrganizationId { get; set; }

    public string OrganizationName { get; set; } = null!;

    public Guid? OrganizationLogoId { get; set; }

    [JsonIgnore]
    public StorageType? OrganizationLogoStorageType { get; set; }

    [JsonIgnore]
    public string? OrganizationLogoKey { get; set; }

    public string? OrganizationLogoURL { get; set; }

    public Guid OrganizationStatusId { get; set; }

    public OrganizationStatus OrganizationStatus { get; set; }

    public decimal? OrganizationZltoRewardPoolCurrentFinancialYear { get; set; }

    public decimal? OrganizationZltoRewardCumulativeCurrentFinancialYear { get; set; }

    public decimal? OrganizationZltoRewardBalanceCurrentFinancialYear { get; set; }

    public decimal? OrganizationYomaRewardPoolCurrentFinancialYear { get; set; }

    public decimal? OrganizationYomaRewardCumulativeCurrentFinancialYear { get; set; }

    public decimal? OrganizationYomaRewardBalanceCurrentFinancialYear { get; set; }

    public string? Summary { get; set; }

    public string? Instructions { get; set; }

    public string? URL { get; set; }

    public decimal? ZltoReward { get; set; }

    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance { get; set; }

    public decimal? YomaReward { get; set; }

    public decimal? YomaRewardPool { get; set; }

    public decimal? YomaRewardCumulative { get; set; }

    public decimal? YomaRewardBalance { get; set; }

    public bool VerificationEnabled { get; set; }

    [JsonIgnore]
    public string? VerificationMethodValue { get; set; }

    public VerificationMethod? VerificationMethod { get; set; }

    public Guid? DifficultyId { get; set; }

    public string? Difficulty { get; set; }

    public Guid? CommitmentIntervalId { get; set; }

    public Core.TimeIntervalOption? CommitmentInterval { get; set; }

    public short? CommitmentIntervalCount { get; set; }

    public string? CommitmentIntervalDescription { get; set; }

    #region Verification Limits and Counts
    public int? ParticipantLimit { get; set; }

    public int? ParticipantCount { get; set; }
    #endregion Verification Limits and Counts

    public Guid StatusId { get; set; }

    public Status Status { get; set; }

    [JsonIgnore]
    public string? KeywordsFlatten { get; set; }

    public List<string>? Keywords { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public bool CredentialIssuanceEnabled { get; set; }

    public string? SSISchemaName { get; set; }

    public bool? Featured { get; set; }

    public Guid? EngagementTypeId { get; set; }

    public Core.EngagementTypeOption? EngagementType { get; set; }

    /// <summary>
    /// Indicates that the opportunity can be shared with external partners (push sync).
    /// Yoma remains the source of truth and controls the opportunity.
    /// Actual sharing depends on partner-specific sharing conditions.
    /// </summary>
    public bool? ShareWithPartners { get; set; }

    public bool? Hidden { get; set; }

    /// <summary>
    /// Identifier assigned by an external partner for this opportunity when it is pushed from Yoma.
    /// This value is stored to support subsequent synchronization operations such as updates or deletions
    /// against the partner system. It represents the partner's reference to this Yoma opportunity.
    /// </summary>
    [JsonIgnore]
    public string? ExternalId { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }

    public bool Published { get; set; }

    public bool IsCompletable
    {
      get
      {
        var result = this.Completable(out var reason);
        NonCompletableReason = reason;
        return result;
      }
    }

    public string? NonCompletableReason { get; private set; }

    /// <summary>
    /// Partner synchronization state for the opportunity.
    ///
    /// Pull-synchronized:
    /// - The external partner is the source of truth
    /// - The opportunity is locked for editing
    /// - Status changes are not permitted
    /// - Local presentation actions such as hiding and featuring are still permitted for organization admins and super admins
    /// - Administrative deletion is only permitted for super admins; this is treated as a terminal override and prevents the opportunity from being recreated or updated again via synchronization
    /// - A pull-synchronized opportunity cannot also be shared via push synchronization
    ///
    /// Push-synchronized:
    /// - Yoma remains the source of truth
    /// - The opportunity remains editable in Yoma
    /// - Update restrictions may still apply once shared, based on partner-specific synchronization rules
    /// - Synchronization state is included for visibility and rule evaluation
    /// </summary>
    public SyncInfo? SyncedInfo { get; set; }

    public List<Lookups.OpportunityCategory>? Categories { get; set; }

    public List<Country>? Countries { get; set; }

    public List<Language>? Languages { get; set; }

    public List<Skill>? Skills { get; set; }

    public List<Lookups.OpportunityVerificationType>? VerificationTypes { get; set; }
  }
}
