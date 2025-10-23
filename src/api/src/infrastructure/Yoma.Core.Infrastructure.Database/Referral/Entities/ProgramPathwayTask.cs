using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("ProgramPathwayTask", Schema = "Referral")]
  [Index(nameof(StepId), nameof(Order), nameof(OrderDisplay), nameof(DateCreated), nameof(DateModified))]
  public class ProgramPathwayTask : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("PathwayId")]
    public Guid StepId { get; set; }
    public ProgramPathwayStep Step { get; set; } = null!;  

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string EntityType { get; set; } = null!;

    [ForeignKey("OpportunityId")]
    public Guid? OpportunityId { get; set; }
    public Opportunity.Entities.Opportunity? Opportunity { get; set; }

    public short? Order { get; set; }

    [Required]
    public short OrderDisplay { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
