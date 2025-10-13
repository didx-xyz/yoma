namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Referral program configuration (platform-wide; supports multiple programs; exactly one may be the default).
  /// NOTES
  /// • Scope: Programs are Yoma-wide (no per-organization programs).
  /// • Claims & caps:
  ///    – Per-referrer completion cap and program-wide completion cap are enforced at claim time:
  ///      if a cap is reached, NEW claims are blocked.
  ///    – Claims created before a cap was reached may still complete, but no rewards are paid once a cap is reached.
  /// • Rewards timing: Rewards are determined at completion time (not at claim) using the program’s then-current values.
  /// • Pool behavior: Program-level ZLTO pool covers both referee and referrer; on completion, pay from the remaining pool
  ///   with referee priority and allow partial payouts (referee first, then referrer). If the pool is empty, pay 0.
  /// </summary>
  public class ReferralProgram
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

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
    public int? CompletionLimitReferee { get; set; }

    /// <summary>
    /// Program-wide completion cap (all users/links) for THIS program.
    /// Checked at claim: if the program’s completed count ≥ this value, block NEW claims for everyone.
    /// Claims made earlier may still complete, but no rewards are paid once the cap is reached.
    /// null = no program-wide completion cap.
    /// </summary>
    public int? CompletionLimit { get; set; }

    public int? CompletionTotal { get; set; }

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

    public decimal? ZltoRewardBalance { get; set; }

    /// <summary>
    /// Toggle: proof of personhood required to qualify (phone OTP or social sign-in).
    /// Phase 1: binary toggle only; no per-method configuration.
    /// </summary>
    public bool ProofOfPersonhoodRequired { get; set; }

    /// <summary>
    /// Toggle: proof of personhood required to qualify (phone OTP or social sign-in).
    /// </summary>
    public bool PathwaysRequired { get; set; }

    /// <summary>
    /// Determines whether a referrer may hold multiple active links concurrently
    /// (otherwise only one active link at a time).
    /// </summary>
    public bool MultipleLinksAllowed { get; set; }

    public Guid StatusId { get; set; }

    public ProgramStatus Status { get; set; }

    public bool? IsDefault { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<ReferralPathway>? Pathways { get; set; }
  }
}
