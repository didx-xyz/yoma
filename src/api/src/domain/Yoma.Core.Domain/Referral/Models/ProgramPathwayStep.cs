namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// A Step groups one or more Tasks and defines how many must be completed
  /// for that step to count as “complete”.
  ///
  /// Step ordering and completion rules:
  ///
  /// • Step Rule:
  ///   – All → all tasks in the step must be completed (task order optional).
  ///   – Any → any single task in the step completes the step (task order ignored).
  ///
  /// • Step OrderMode:
  ///   – Sequential → tasks (and optionally steps) must be completed in order.
  ///     Only valid when Rule = All.
  ///   – AnyOrder → tasks can be completed in any sequence.
  ///
  /// • OrderDisplay:
  ///   – Reflects the display order in which steps were defined by the admin.
  ///     Always sequential, regardless of logical OrderMode.
  /// </summary>
  public class ProgramPathwayStep
  {
    public Guid Id { get; set; }

    public Guid PathwayId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public short? Order { get; set; }

    public short OrderDisplay { get; set; }

    public List<ProgramPathwayTask>? Tasks { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
