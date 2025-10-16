using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramPathwayStepRequestBase
  {
    [Required]
    public string Name { get; set; }

    public string? Description { get; set; }

    [Required]
    public PathwayStepRule Rule { get; set; }

    public byte? Order { get; set; }

    public List<ProgramPathwayTaskRequestBase> Tasks { get; set; }
  }

  public class ProgramPathwayStepRequestCreate : ProgramPathwayStepRequestBase
  {
    [Required]
    public new List<ProgramPathwayTaskRequestCreate> Tasks { get; set; }
  }

  public class ProgramPathwayStepRequestUpdate : ProgramPathwayStepRequestBase
  {
    [Required]
    public Guid Id { get; set; }

    [Required]
    public new List<ProgramPathwayTaskRequestUpdate> Tasks { get; set; }
  }
}
