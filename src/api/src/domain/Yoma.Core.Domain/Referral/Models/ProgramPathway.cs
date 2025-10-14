namespace Yoma.Core.Domain.Referral.Models
{
  /// <summary>
  /// Admin-defined engagement “checklist” for a program.
  /// The checklist is made up of Steps, each containing one or more Tasks.
  /// </summary>
  public class ProgramPathway
  {
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public DateTimeOffset DateCreated { get; set; }

    public DateTimeOffset DateModified { get; set; }

    public List<ProgramPathwayStep>? Steps { get; set; }
  }
}
