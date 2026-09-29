using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunityTargetedGroups", Schema = "Opportunity")]
  [Index(nameof(OpportunityId), nameof(TargetedGroupId), IsUnique = true)]
  public class OpportunityTargetedGroup : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; } = null!;

    [Required]
    [ForeignKey("TargetedGroupId")]
    public Guid TargetedGroupId { get; set; }
    public Database.Lookups.Entities.TargetedGroup TargetedGroup { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
