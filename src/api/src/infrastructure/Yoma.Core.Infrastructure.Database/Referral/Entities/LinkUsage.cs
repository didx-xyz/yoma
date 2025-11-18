using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Referral.Entities.Lookups;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("LinkUsage", Schema = "Referral")]
  [Index(nameof(UserId), nameof(ProgramId), IsUnique = true)]
  [Index(nameof(LinkId), nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
  public class LinkUsage : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("ProgramId")]
    public Guid ProgramId { get; set; }
    public Program Program { get; set; } = null!;

    [Required]
    [ForeignKey("LinkId")]
    public Guid LinkId { get; set; }
    public Link Link { get; set; } = null!;

    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public LinkUsageStatus Status { get; set; } = null!;

    [Column(TypeName = "decimal(8,2)")]
    public decimal? ZltoRewardReferrer { get; set; }

    [Column(TypeName = "decimal(8,2)")]
    public decimal? ZltoRewardReferee { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
