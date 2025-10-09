namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// PHASE 1 (now)
  ///   • Single, platform-wide “Default Program”.
  /// FUTURE (not in this phase)
  ///   • Multiple programs with states (Active/Inactive/Expired/Archived).
  ///   • Program start/end windows and state transitions.
  /// NOTES
  ///   • Programs are Yoma-wide (no per-organization programs in Phase 1).
  ///   • RefereeLimit: when a referee tries to claim a link, we compare the referrer’s completed referrals to the limit.
  ///       - If the completed count has reached the limit, new claims are blocked.
  ///       - Claims that are already pending may still complete, but no rewards are awarded.
  ///   • Rewards are determined at completion time (not at claim), using the program’s then-current values.
  ///   • Referrer blocking (future): block at user level; optionally cancel pending claimed links; blocked referrers cannot create new links.
  /// </summary>
  public class ReferralProgram
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    /// <summary>
    /// Days allowed for a referee to finish required steps after claim/registration.
    /// null = no program-level window (system default or unlimited).
    /// </summary>
    public int? CompletionWindowInDays { get; set; }

    /// <summary>
    /// Max number of successfully completed referrals per referrer for THIS program (across all their links).
    /// null = no program-level cap (a system default may apply).
    /// Future: consider a global cap per referrer across programs.
    /// </summary>
    public int? RefereeLimit { get; set; }

    public decimal? ZltoRewardReferrer { get; set; }

    public decimal? ZltoRewardReferee { get; set; }

    /// <summary>
    /// Program-level ZLTO pool across ALL links and users for THIS program.
    /// On completion, allocate from the remaining pool with REFEREE PRIORITY and allow PARTIAL payouts:
    ///   1) Pay referee up to their configured amount (partial if needed), then
    ///   2) Pay referrer from any leftover (partial if needed).
    /// If the pool is empty, no payouts are made (completion still counts for status/analytics).
    /// null = no program-level pool (no budget enforcement in this phase).
    /// Future: global pool across programs.
    /// </summary>
    public decimal? ZltoRewardPool { get; set; }

    /// <summary>
    /// Toggle: proof of personhood required to qualify (phone OTP or social sign-in).
    /// Phase 1: binary toggle only; no per-method configuration.
    /// </summary>
    public bool ProofOfPersonhoodRequired { get; set; }

    /// <summary>
    /// Toggle: completing the configured ReferralPathway (steps/tasks) is required to qualify as a referee.
    /// Phase 1: a single pathway; tasks are opportunity completions (future: multiple pathways/policies).
    /// </summary>
    public bool PathwaysRequired { get; set; }

    /// <summary>
    /// Controls whether a referrer may hold multiple active links concurrently (otherwise only one active link at a time).
    /// </summary>
    public bool MultipleLinksAllowed { get; set; }

    public Guid StatusId { get; set; }

    public ProgramStatus Status { get; set; }

    public DateTimeOffset DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<ReferralPathway>? Pathways { get; set; }
  }
}
