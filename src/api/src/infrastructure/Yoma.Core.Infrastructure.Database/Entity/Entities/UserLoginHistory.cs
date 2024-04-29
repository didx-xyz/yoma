using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserLoginHistory", Schema = "Entity")]
  [Index(nameof(UserId), nameof(ClientId), nameof(DateCreated))]
  public class UserLoginHistory : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; }

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string ClientId { get; set; }

    [Column(TypeName = "varchar(39)")]
    public string? IpAddress { get; set; }

    [Column(TypeName = "varchar(255)")]
    public string? AuthMethod { get; set; }

    [Column(TypeName = "varchar(255)")]
    public string? AuthType { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
