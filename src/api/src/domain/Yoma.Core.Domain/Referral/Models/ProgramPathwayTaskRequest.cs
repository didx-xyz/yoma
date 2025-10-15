using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramPathwayTaskRequestBase
  {
    [Required]
    public PathwayTaskEntityType EntityType { get; set; }

    [Required]
    public Guid EntityId { get; set; }

    public byte? Order { get; set; }
  }

  public class ProgramPathwayTaskRequestCreate : ProgramPathwayTaskRequestBase { }

  public class ProgramPathwayTaskRequestUpdate : ProgramPathwayTaskRequestBase
  {
    [Required]
    public Guid Id { get; set; }
  }
}
