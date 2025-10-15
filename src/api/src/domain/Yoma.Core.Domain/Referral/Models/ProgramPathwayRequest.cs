using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramPathwayRequestBase
  {
    [Required]
    public string Name { get; set; }

    public string? Description { get; set; }
  }

  public class ProgramPathwayRequestCreate : ProgramPathwayRequestBase
  {
    [Required]
    public List<ProgramPathwayStepRequestCreate> Steps { get; set; }
  }

  public class ProgramPathwayRequestUpdate : ProgramPathwayRequestBase
  {
    [Required]
    public Guid Id { get; set; }

    [Required]
    public List<ProgramPathwayStepRequestUpdate> Steps { get; set; }
  }
}
