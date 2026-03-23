namespace Yoma.Core.Domain.Referral
{
  /// <summary>
  /// Program lifecycle. Effects:
  /// - New Link?  Can a referrer create new links under this program.
  /// - New Claim? Can a referee claim (use) an existing link under this program.
  /// - Pending Usages: What happens to already-claimed, still-pending usages.
  /// </summary>
  public enum ProgramStatus
  {
    /// <summary>
    /// Active
    /// - New Link? YES
    /// - New Claim? YES
    /// - Pending Usages: Continue and may complete.
    /// Editable: YES
    /// Transitions: → Inactive (manual), → Expired (end date), → UnCompletable (auto), → LimitReached (auto), → Deleted (manual)
    /// </summary>
    Active,

    /// <summary>
    /// Inactive (manually paused)
    /// - New Link? NO (existing links remain valid but cannot accept new claims)
    /// - New Claim? NO
    /// - Pending Usages: Continue and may complete (do not punish in-flight)
    /// Editable: YES (for configuration or fixing); Reactivable: YES (→ Active)
    /// Transitions: → Active (manual), → Deleted (manual/retention)
    /// </summary>
    Inactive,

    /// <summary>
    /// Expired (end date reached OR auto-expired after UnCompletable grace timeout)
    /// - New Link? NO (existing links are expired)
    /// - New Claim? NO
    /// - Active Links and Pending Usages: EXPIRE (cascade)
    /// Editable: NO (must go Inactive → edit → Active)
    /// Transitions: → Deleted (manual/retention)
    /// </summary>
    Expired,

    /// <summary>
    /// LimitReached (global completion cap hit) — terminal for growth
    /// - New Link? NO (all links flagged LimitReached)
    /// - New Claim? NO (claims blocked)
    /// - Pending Usages: Continue and may complete (do not punish in-flight)
    /// Editable: NO (locked for audit; Terminal)
    /// Transitions: → Deleted (retention cleanup)
    /// </summary>
    LimitReached,

    /// <summary>
    /// UnCompletable (pathway broken: required opportunities unavailable)
    /// - New Link? NO (existing links remain valid but cannot accept new claims)
    /// - New Claim? NO
    /// - Pending Usages: Continue during grace period; if not fixed before grace end → Program → Expired and usages → EXPIRE (cascade)
    /// Editable: YES (admins can fix); on fix and activation → Active
    /// Auto-behavior: If not fixed within grace → Expired (NonCompletable timeout)
    /// </summary>
    UnCompletable,

    /// <summary>
    /// Deleted (terminal)
    /// - New Link? NO (existing links are CANCELLED)
    /// - New Claim? NO
    /// - Pending Usages: Continue and may complete (do not punish in-flight)
    /// Editable: NO (Terminal)
    /// Notes: Manual delete allowed anytime; retention cleanup may also land here.
    /// </summary>
    Deleted
  }

  public enum PathwayCompletionRule
  {
    All,
    Any
  }

  public enum PathwayOrderMode
  {
    Sequential,
    AnyOrder
  }

  public enum PathwayTaskEntityType
  {
    Opportunity = 1
  }

  [Flags]
  public enum ProofOfPersonhoodMethod
  {
    None,
    OTP,
    SocialLogin
  }

  /// <summary>
  /// Link lifecycle (per referrer).
  /// </summary>
  public enum ReferralLinkStatus
  {
    /// <summary>
    /// Active
    /// - New Claim? YES (while Program allows it)
    /// - Pending Usages: Continue and may complete
    /// Transitions: → Cancelled (manual/admin), → LimitReached (per-link cap), → Expired (program expired)
    /// </summary>
    Active,

    /// <summary>
    /// Cancelled (manual/admin, blocking a referrer, or via program deletion)
    /// - New Claim? NO
    /// - Pending Usages: Continue and may complete (do not punish in-flight)
    /// Terminal for the link.
    /// </summary>
    Cancelled,

    /// <summary>
    /// LimitReached (per-referrer or global completion cap cap hit)
    /// - New Claim? NO
    /// - Pending Usages: Continue and may complete (in-flight not punished)
    /// Terminal for the link.
    /// </summary>
    LimitReached,

    /// <summary>
    /// Expired (program moved to Expired / UnCompletable timeout)
    /// - New Claim? NO
    /// - Pending Usages: EXPIRE (cascade)
    /// Terminal for the link.
    /// </summary>
    Expired
  }

  /// <summary>
  /// Usage lifecycle (per referee claim).
  /// </summary>
  public enum ReferralLinkUsageStatus
  {
    /// <summary>
    /// Initiated
    /// - Referee intent captured after sign-in but before onboarding completion.
    /// - Short-lived state used to track early claim intent.
    /// - Can progress to Pending when the referee completes onboarding and claims.
    /// - Automatically transitions to Abandoned if not progressed within the configured timeout.
    /// </summary>
    Initiated,

    /// <summary>
    /// Pending
    /// - Valid claim created after onboarding completion.
    /// - Can progress to Completed while within the allowed completion window.
    /// - Expires if completion window, default expiry window, or program end is reached.
    /// </summary>
    Pending,

    /// <summary>
    /// Completed (terminal)
    /// - Rewards allocated at completion time (pool + caps respected).
    /// </summary>
    Completed,

    /// <summary>
    /// Expired (terminal)
    /// - Claim expired after reaching Pending due to completion window elapsed or program/link expiration.
    /// </summary>
    Expired,

    /// <summary>
    /// Abandoned (terminal)
    /// - Initiated intent that never progressed to a valid claim.
    /// - Occurs when an Initiated usage expires without transitioning to Pending.
    /// - Does not block future claims.
    /// </summary>
    Abandoned
  }

  public enum ReferralBlockReason
  {
    Other
  }

  public enum ReferralTriggerSource
  {
    ProgramUpdated,
    IdentityAction,
    OpportunityCompletion
  }

  public enum ReferralParticipationRole
  {
    Referrer,
    Referee
  }
}
