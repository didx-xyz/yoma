using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserLoginHistory", Schema = "Entity")]
  [Index(nameof(UserId), nameof(ClientId), nameof(IdentityProvider), nameof(DateCreated))]
  public class UserLoginHistory : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string ClientId { get; set; } = null!;

    [Column(TypeName = "varchar(39)")]
    public string? IpAddress { get; set; }

    [Column(TypeName = "varchar(255)")]
    public string? AuthMethod { get; set; }

    [Column(TypeName = "varchar(255)")]
    public string? AuthType { get; set; }

    [Column(TypeName = "varchar(100)")]
    public string? IdentityProvider { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
