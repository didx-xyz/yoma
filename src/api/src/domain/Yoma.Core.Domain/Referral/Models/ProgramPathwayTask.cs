namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// A concrete Task the referee must complete as part of a Step.
  ///
  /// Phase 1 supports EntityType = Opportunity (complete a specific opportunity).
  ///
  /// Task ordering within a step:
  ///
  /// • OrderMode = Sequential → enforce sequential execution (Order = 1..N).
  /// • OrderMode = AnyOrder → tasks can be completed in any order (Order = null).
  ///
  /// Notes:
  /// - When Step Rule = Any, task order must always be null.
  /// - OrderDisplay always reflects creation/display order from the UI.
  /// - Task order is only meaningful when the parent step Rule = All
  ///   and the step has more than one task.
  /// </summary>
  public class ProgramPathwayTask
  {
    public Guid Id { get; set; }

    public Guid StepId { get; set; }

    public PathwayTaskEntityType EntityType { get; set; }

    public Opportunity.Models.OpportunityItem? Opportunity { get; set; }

    public short? Order { get; set; }

    public short OrderDisplay { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
