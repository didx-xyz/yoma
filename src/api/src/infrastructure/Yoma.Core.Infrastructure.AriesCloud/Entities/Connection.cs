using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
  [Table("Connection", Schema = "AriesCloud")]
  [Index(nameof(SourceTenantId), nameof(TargetTenantId), nameof(Protocol), IsUnique = true)]
  public class Connection : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceTenantId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string TargetTenantId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceConnectionId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string TargetConnectionId { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string Protocol { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
