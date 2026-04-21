using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.PartnerSync.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.PartnerSync.Entities
{
  //TODO: Regenerate migration 'ApplicationDb_Partner_Sync_Pull' due to index changes below

  [Table("ProcessingLog", Schema = "PartnerSync")]
  //entity per sync type and partner can be created or deleted once and updated multiple times; no unique index; handled by service
  [Index(nameof(SyncType), nameof(EntityType), nameof(OpportunityId), nameof(StatusId), nameof(DateModified))]
  [Index(nameof(SyncType), nameof(EntityType), nameof(PartnerId), nameof(EntityExternalId), nameof(StatusId), nameof(DateModified))]
  [Index(nameof(SyncType), nameof(PartnerId), nameof(Action), nameof(StatusId), nameof(DateModified))]
  public class ProcessingLog : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(25)")]
    public string EntityType { get; set; } = null!;

    [ForeignKey("OpportunityId")]
    public Guid? OpportunityId { get; set; }
    public Opportunity.Entities.Opportunity? Opportunity { get; set; }

    [Required]
    [ForeignKey("PartnerId")]
    public Guid PartnerId { get; set; }
    public Partner Partner { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string SyncType { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string Action { get; set; } = null!;

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public ProcessingStatus Status { get; set; } = null!;

    [Column(TypeName = "varchar(50)")]
    public string? EntityExternalId { get; set; }

    [Column(TypeName = "text")] //MS SQL: varchar(MAX)
    public string? ErrorReason { get; set; }

    public byte? RetryCount { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
