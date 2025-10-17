namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// A concrete Task the referee must complete.
  /// Phase 1 supports EntityType = Opportunity (complete a specific opportunity).
  ///
  /// Task ordering within a step:
  ///
  /// • Order = null → no enforced sequence between tasks.
  /// • Order = 1..N → sequential execution (only valid when the parent step Rule = All).
  ///
  /// Notes:
  /// - When Step Rule = Any, task order cannot be specified (must be null).
  /// - Task order is only meaningful if the step contains more than one task.
  /// </summary>
  public class ProgramPathwayTask
  {
    public Guid Id { get; set; }

    public Guid StepId { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Opportunity.Models.OpportunityItem? Opportunity { get; set; }

    public byte? Order { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
