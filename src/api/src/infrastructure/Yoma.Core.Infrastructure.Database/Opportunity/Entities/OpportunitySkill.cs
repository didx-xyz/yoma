using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunitySkills", Schema = "Opportunity")]
  [Index(nameof(OpportunityId), nameof(SkillId), IsUnique = true)]
  public class OpportunitySkill : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; } = null!;

    [Required]
    [ForeignKey("SkillId")]
    public Guid SkillId { get; set; }
    public Skill Skill { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
