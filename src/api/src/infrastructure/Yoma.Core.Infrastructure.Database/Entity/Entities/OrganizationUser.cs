using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("OrganizationUsers", Schema = "entity")]
  [Index(nameof(OrganizationId), nameof(UserId), IsUnique = true)]
  public class OrganizationUser : BaseEntity<Guid>
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
