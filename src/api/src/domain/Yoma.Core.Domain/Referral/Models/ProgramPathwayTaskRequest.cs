namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramPathwayTaskRequestBase
  {
    public PathwayTaskEntityType EntityType { get; set; }

    public Guid EntityId { get; set; }

    public byte? Order { get; set; }
  }

  public class ProgramPathwayTaskRequestCreate : ProgramPathwayTaskRequestBase { }

  public class ProgramPathwayTaskRequestUpdate : ProgramPathwayTaskRequestBase
  {
    public Guid Id { get; set; }
  }
}
