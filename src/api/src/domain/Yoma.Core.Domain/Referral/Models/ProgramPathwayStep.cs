namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// A Step groups one or more Tasks and defines how many must be completed.
  ///
  /// Step ordering and completion rules:
  ///
  /// • Step Rule:
  ///   - All → all tasks in the step must be completed (task order optional).
  ///   - Any → any single task in the step completes the step (task order ignored).
  ///
  /// • Step order (relative to other steps):
  ///   - null  → unordered; can be completed at any time.
  ///   - 1..N  → ordered; lower numbers must be completed before higher ones.
  ///     (Only meaningful when multiple ordered steps exist.)
  /// </summary>
  public class ProgramPathwayStep
  {
    public Guid Id { get; set; }

    public Guid PathwayId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }

    public List<ProgramPathwayTask>? Tasks { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }
  }
}
