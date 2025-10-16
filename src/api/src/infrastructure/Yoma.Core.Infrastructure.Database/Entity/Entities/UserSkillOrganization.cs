using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserSkillOrganizations", Schema = "Entity")]
  [Index(nameof(UserSkillId), nameof(OrganizationId), IsUnique = true)]
  public class UserSkillOrganization : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("UserSkillId")]
    public Guid UserSkillId { get; set; }
    public UserSkill UserSkill { get; set; } = null!;

    [Required]
    [ForeignKey("OrganizationId")]
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
