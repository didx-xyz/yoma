using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
  [Table("Connection", Schema = "AriesCloud")]
  [Index(nameof(SourceTenantId), nameof(TargetTenantId), nameof(Protocol), IsUnique = true)]
  public class Connection : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceTenantId { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string TargetTenantId { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string SourceConnectionId { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string TargetConnectionId { get; set; }

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string Protocol { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
