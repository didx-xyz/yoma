using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserSkills", Schema = "Entity")]
  [Index(nameof(UserId), nameof(SkillId), IsUnique = true)]
  public class UserSkill : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; }

    [Required]
    [ForeignKey("SkillId")]
    public Guid SkillId { get; set; }
    public Skill Skill { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    public ICollection<UserSkillOrganization> Organizations { get; set; }
  }
}
