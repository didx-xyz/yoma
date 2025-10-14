namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramPathwayRequestBase
  {
    public string Name { get; set; }

    public string? Description { get; set; }
  }

  public class ProgramPathwayRequestCreate : ProgramPathwayRequestBase
  {
    public List<ProgramPathwayStepRequestCreate> Steps { get; set; }
  }

  public class ProgramPathwayRequestUpdate : ProgramPathwayRequestBase
  {
    public Guid Id { get; set; }

    public List<ProgramPathwayStepRequestUpdate> Steps { get; set; }
  }
}
