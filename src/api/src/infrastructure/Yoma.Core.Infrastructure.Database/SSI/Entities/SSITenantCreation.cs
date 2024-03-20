using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities
{
  [Table("TenantCreation", Schema = "SSI")]
  //unique index declared in OnModelCreating to cater for nullability constraints
  [Index(nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
  public class SSITenantCreation : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(25)")]
    public string EntityType { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public SSITenantCreationStatus Status { get; set; }

    [ForeignKey("UserId")]
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    [ForeignKey("OrganizationId")]
    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    [Column(TypeName = "varchar(50)")]
    public string? TenantId { get; set; }

    [Column(TypeName = "text")] //MS SQL: varchar(MAX)
    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
