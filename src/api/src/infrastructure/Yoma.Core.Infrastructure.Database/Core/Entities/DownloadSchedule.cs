using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities.Lookups;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
  [Table("Schedule", Schema = "Download")]
  [Index(nameof(UserId), nameof(Type), nameof(FilterHash), nameof(StatusId), nameof(FileId), nameof(DateCreated), nameof(DateModified))]
  public class DownloadSchedule : BaseEntity<Guid>
  {
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; }

    [Required]
    [Column(TypeName = "varchar(50)")]
    public string Type { get; set; }

    [Required]
    [Column(TypeName = "text")] //MS SQL: varchar(MAX)
    public string Filter { get; set; }

    [Required]
    [Column(TypeName = "varchar(64)")]
    public string FilterHash { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public DownloadScheduleStatus Status { get; set; }

    [ForeignKey(nameof(FileId))]
    public Guid? FileId { get; set; }
    public BlobObject? File { get; set; }

    [Column(TypeName = "text")] //MS SQL: varchar(MAX)
    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
