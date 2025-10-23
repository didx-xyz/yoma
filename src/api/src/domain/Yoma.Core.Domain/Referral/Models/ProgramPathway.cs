namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Admin-defined engagement “checklist” for a program.
  /// The checklist is composed of ordered or unordered Steps,
  /// each containing one or more Tasks.
  ///
  /// Pathway ordering and rules:
  ///
  /// • Pathway Rule:
  ///   – All → all steps must be completed to finish the program.
  ///   – Any → any single step completes the pathway.
  ///
  /// • Pathway OrderMode:
  ///   – Sequential → steps must be completed in order (Step 1 → Step 2 → ...).
  ///     Only valid when Rule = All.
  ///   – AnyOrder → steps can be completed in any order.
  ///
  /// • Ordering:
  ///   – Step Order and OrderDisplay values are hydrated server-side
  ///     based on the Pathway’s configured OrderMode and Rule.
  ///     The UI does not control or persist these values directly.
  /// </summary>
  public class ProgramPathway
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<ProgramPathwayStep>? Steps { get; set; }
  }
}
