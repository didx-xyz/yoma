using Newtonsoft.Json;

namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageInfo
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string ProgramName { get; set; } = null!;

    public string? ProgramDescription { get; set; }

    public Guid LinkId { get; set; }

    public string LinkName { get; set; } = null!;

    #region Referrer Info (mapped to the link)
    public Guid UserIdReferrer { get; set; }

    public string? UserDisplayNameReferrer { get; set; } = null!;

    public string? UserEmailReferrer { get; set; }

    public string? UserPhoneNumberReferrer { get; set; }
    #endregion

    #region Referee Info (mapped to the usage)
    public Guid UserId { get; set; }

    public string? UserDisplayName { get; set; } = null!;

    public string? UserEmail { get; set; }

    public string? UserPhoneNumber { get; set; }
    #endregion

    public Guid StatusId { get; set; }

    public ReferralLinkUsageStatus Status { get; set; }

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    public DateTimeOffset DateClaimed { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public DateTimeOffset? DateExpired { get; set; }

    // see ILinkUsageService.ToInfoParseProgress
    #region Computed Properties 
    // POP status (done or not), regardless of whether it's required
    public bool? ProofOfPersonhoodCompleted { get; set; }

    // POP method(s) used, regardless of requirement
    public ProofOfPersonhoodMethod ProofOfPersonhoodMethod { get; set; }

    // Pathway status if a pathway exists (null if none), regardless if whether it's required
    public bool? PathwayCompleted { get; set; }

    [JsonIgnore]
    // Internal effective completion state after applying required logic used to flip the Status to Completed (see ILinkUsageService.ProcessProgressByUserId)
    // If a requirement (POP or Pathway) is not required → treated as completed.
    // Otherwise reflects the actual completion state.
    // null = not evaluated yet.
    internal bool? EffectiveCompleted { get; set; }

    public decimal? PercentComplete { get; set; }

    public ProgramPathwayProgress? Pathway { get; set; }
    #endregion
  }
}
