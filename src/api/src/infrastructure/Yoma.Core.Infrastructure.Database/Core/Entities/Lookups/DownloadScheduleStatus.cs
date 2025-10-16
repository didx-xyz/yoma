using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Core.Entities.Lookups
{
  [Table("ScheduleStatus", Schema = "Download")]
  [Index(nameof(Name), IsUnique = true)]
  public class DownloadScheduleStatus : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(30)")]
    public string Name { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
