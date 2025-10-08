using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("OrganizationUsers", Schema = "Entity")]
  [Index(nameof(OrganizationId), nameof(UserId), IsUnique = true)]
  public class OrganizationUser : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OrganizationId")]
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; }

    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
