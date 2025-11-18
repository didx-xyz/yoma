namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public List<ProgramPathwayStepInfo> Steps { get; set; } = null!;

    public int StepsTotal => Steps.Count;

    public bool IsCompletable { get; set; }
  }
}
