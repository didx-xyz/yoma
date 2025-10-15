namespace Yoma.Core.Domain.Referral.Models
{
  public class ProgramPathwayStepInfo
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string? Description { get; set; }

    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }

    public List<ProgramPathwayTaskInfo> Tasks { get; set; }

    public int TasksTotal => Tasks.Count;
  }
}
