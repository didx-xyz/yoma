using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserSkillOrganizations", Schema = "Entity")]
  [Index(nameof(UserSkillId), nameof(OrganizationId), IsUnique = true)]
  public class UserSkillOrganization : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("UserSkillId")]
    public Guid UserSkillId { get; set; }
    public UserSkill UserSkill { get; set; }

    [Required]
    [ForeignKey("OrganizationId")]
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
