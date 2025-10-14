namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramPathwayStepRequestBase
  {
    public string Name { get; set; }

    public string? Description { get; set; }

    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }
  }

  public class ProgramPathwayStepRequestCreate : ProgramPathwayStepRequestBase
  {
    public List<ProgramPathwayTaskRequestCreate>? Tasks { get; set; }
  }

  public class ProgramPathwayStepRequestUpdate : ProgramPathwayStepRequestBase
  {
    public Guid Id { get; set; }

    public List<ProgramPathwayTaskRequestUpdate>? Tasks { get; set; }
  }
}
