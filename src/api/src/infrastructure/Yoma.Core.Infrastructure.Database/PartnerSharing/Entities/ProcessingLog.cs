using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.PartnerSharing.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.PartnerSharing.Entities
{
  [Table("ProcessingLog", Schema = "PartnerSharing")]
  //entity per partner can be created or deleted once and updated multiple times; no unique index; handled by service
  [Index(nameof(EntityType), nameof(OpportunityId), nameof(PartnerId), nameof(Action), nameof(StatusId), nameof(EntityExternalId), nameof(DateCreated), nameof(DateModified))]
  public class ProcessingLog : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(25)")]
    public string EntityType { get; set; }

    [ForeignKey("OpportunityId")]
    public Guid? OpportunityId { get; set; }
    public Opportunity.Entities.Opportunity? Opportunity { get; set; }

    [Required]
    [ForeignKey("PartnerId")]
    public Guid PartnerId { get; set; }
    public Partner Partner { get; set; }

    [Required]
    [Column(TypeName = "varchar(25)")]
    public string Action { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public ProcessingStatus Status { get; set; }

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
