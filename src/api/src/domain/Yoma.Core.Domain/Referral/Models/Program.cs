using Newtonsoft.Json;
using Yoma.Core.Domain.BlobProvider;

namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Referral program configuration (platform-wide; supports multiple programs; exactly one may be the default).
  ///
  /// NOTES
  /// • Scope:
  ///   – Programs are Yoma-wide (no per-organization programs).
  ///
  /// • Claims & caps:
  ///   – Per-referrer and program-wide completion caps are enforced at claim time:
  ///     if a cap is reached, NEW claims are blocked.
  ///   – Claims created before a cap was reached may still complete,
  ///     but no rewards are paid once a cap is reached.
  ///
  /// • Rewards timing:
  ///   – Rewards are determined at completion time (not at claim)
  ///     using the program’s then-current reward configuration.
  ///
  /// • Pool behavior:
  ///   – The ZLTO reward pool covers both referrer and referee rewards.
  ///   – On completion, payouts draw from the remaining pool,
  ///     paying the referee first and the referrer second.
  ///   – Partial payouts are allowed (referee priority).
  ///   – If the pool is empty, the completion yields 0 reward.
  /// </summary>
  public class Program
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public Guid? ImageId { get; set; }

    [JsonIgnore]
    public StorageType? ImageStorageType { get; set; }

    [JsonIgnore]
    public string? ImageKey { get; set; }

    public string? ImageURL { get; set; }

    /// <summary>
    /// Days allowed for a referee to finish required steps after claim/registration.
    /// null = no program-level window
    /// </summary>
    public int? CompletionWindowInDays { get; set; }

    /// <summary>
    /// Per-referrer completion cap for THIS program (across all their links).
    /// Checked at claim: if the referrer’s completed count ≥ this value, block NEW claims.
    /// Claims made earlier may still complete, but no rewards are paid once the cap is reached.
    /// null = no per-referrer cap.
    /// </summary>
    public int? CompletionLimitReferee { get; set; }

    /// <summary>
    /// Program-wide completion cap (all users/links) for THIS program.
    /// Checked at claim: if the program’s completed count ≥ this value, block NEW claims for everyone.
    /// Claims made earlier may still complete, but no rewards are paid once the cap is reached.
    /// null = no program-wide completion cap.
    /// </summary>
    public int? CompletionLimit { get; set; }

    public int? CompletionTotal { get; set; }

    public int? CompletionBalance => CompletionLimit.HasValue ? CompletionLimit - (CompletionTotal ?? 0) : null;

    /// <summary>
    /// ZLTO amount for the referrer, read at completion time (not at claim).
    /// null = no program override (system default or 0).
    /// </summary>
    public decimal? ZltoRewardReferrer { get; set; }

    /// <summary>
    /// ZLTO amount for the referee, read at completion time (not at claim).
    /// null = no program override (system default or 0).
    /// </summary>
    public decimal? ZltoRewardReferee { get; set; }

    /// <summary>
    /// Program-level ZLTO pool for THIS program (covers both referee and referrer).
    /// On completion, pay from the remaining pool with referee priority and allow partial payouts:
    ///   1) Pay referee up to their amount (partial if needed),
    ///   2) Then pay referrer from what’s left (partial if needed).
    /// If the pool is empty, pay 0. null = no pool enforcement.
    /// </summary>
    public decimal? ZltoRewardPool { get; set; }

    public decimal? ZltoRewardCumulative { get; set; }

    public decimal? ZltoRewardBalance => ZltoRewardPool.HasValue ? ZltoRewardPool - (ZltoRewardCumulative ?? 0) : null;

    /// <summary>
    /// Toggle: proof of personhood required to qualify (phone OTP or social sign-in).
    /// Phase 1: binary toggle only; no per-method configuration.
    /// </summary>
    public bool ProofOfPersonhoodRequired { get; set; }

    /// <summary>
    /// Toggle: pathway required to qualify.
    /// </summary>
    public bool PathwayRequired { get; set; }

    /// <summary>
    /// Determines whether a referrer may hold multiple active links concurrently
    /// (otherwise only one active link at a time).
    /// </summary>
    public bool MultipleLinksAllowed { get; set; }

    public Guid StatusId { get; set; }

    public ProgramStatus Status { get; set; }

    public bool IsDefault { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public Guid CreatedByUserId { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public Guid ModifiedByUserId { get; set; }

    public ProgramPathway? Pathway { get; set; }
  }
}
