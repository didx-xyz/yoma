namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayStepInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public PathwayCompletionRule Rule { get; set; }

    public PathwayOrderMode OrderMode { get; set; }

    public short? Order { get; set; }

    public short OrderDisplay { get; set; }

    public List<ProgramPathwayTaskInfo> Tasks { get; set; } = null!;

    public int TasksTotal => Tasks.Count;
  }
}
