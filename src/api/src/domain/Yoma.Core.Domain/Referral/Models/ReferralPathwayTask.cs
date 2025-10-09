namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// A concrete Task the referee must complete.
  /// Phase 1 supports EntityType = Opportunity (complete a specific opportunity).
  /// </summary>
  public class ReferralPathwayTask
  {
    public Guid Id { get; set; }

    public Guid StepId { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Guid? OpportunityId { get; set; }

    /// <summary>
    /// Optional task order within the step:
    ///   • null = no enforced order between tasks in this step.
    ///   • 1..n = do in sequence (only applies when the parent step Rule = All).
    /// When the parent step Rule = Any, task ordering is ignored (leave null).
    /// </summary>
    public short? Order { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
