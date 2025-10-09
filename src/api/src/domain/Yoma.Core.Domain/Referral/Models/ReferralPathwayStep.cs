namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// A Step groups one or more Tasks and declares how many must be done.
  /// Steps can be:
  ///   • Unordered (Order = null): can be done anytime, in parallel with other unordered / ordered steps.
  ///   • Ordered  (Order = 1..n): must be completed in ascending order (1 before 2, etc.).
  /// A Step is complete when its Rule is satisfied:
  ///   • All = all tasks in the step must be completed (task order optional).
  ///   • Any = any one task in the step completes the step (task order ignored).
  /// </summary>
  public class ReferralPathwayStep
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    /// <summary>
    /// How this step is considered complete:
    /// • All  = every task in this step must be completed
    /// • Any  = any single task in this step is enough
    /// </summary>
    public PathwayStepRule Rule { get; set; }

    /// <summary>
    /// Optional step order:
    /// • null  = unordered step (can be done at any time)
    /// • 1..n  = ordered step (lower numbers must be completed before higher ones)
    /// Only meaningful if there is more than one ordered step.
    /// </summary>
    public short? Order { get; set; }

    public List<ReferralPathwayTask>? Tasks { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
