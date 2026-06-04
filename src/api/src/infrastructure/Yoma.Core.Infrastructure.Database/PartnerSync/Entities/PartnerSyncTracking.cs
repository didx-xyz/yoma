using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.PartnerSync.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.PartnerSync.Entities
{
  [Table("Tracking", Schema = "PartnerSync")]
  //append-only run history; no unique index; every actual sync run adds a row
  [Index(nameof(SyncType), nameof(EntityType), nameof(SyncScope), nameof(PartnerId), nameof(Status), nameof(DateStamp))]
  [Index(nameof(SyncType), nameof(EntityType), nameof(SyncScope), nameof(PartnerId), nameof(DateStamp))]
  [Index(nameof(PartnerId), nameof(DateStamp))]
  public class PartnerSyncTracking : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("PartnerId")]
    public Guid PartnerId { get; set; }
    public Partner Partner { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string SyncType { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string EntityType { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string SyncScope { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string Status { get; set; } = null!;

    public int? ItemsProcessed { get; set; }

    public int? ItemsSucceeded { get; set; }

    public int? ItemsSkipped { get; set; }

    public int? ItemsFailed { get; set; }

    public int? ItemsCreated { get; set; }

    public int? ItemsUpdated { get; set; }

    public int? ItemsDeleted { get; set; }

    [Column(TypeName = "text")] //MS SQL: varchar(MAX)
    public string? RunFailureReason { get; set; }

    [Required]
    public DateTimeOffset DateStamp { get; set; }
  }
}
