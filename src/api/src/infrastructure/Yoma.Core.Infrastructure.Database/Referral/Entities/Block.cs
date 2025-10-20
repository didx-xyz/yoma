using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Referral.Entities.Lookups;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("Block", Schema = "Referral")]
  [Index(nameof(ReasonId), nameof(DateCreated), nameof(DateModified))]
  public class Block : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [ForeignKey("ReasonId")]
    public Guid ReasonId { get; set; }
    public BlockReason Reason { get; set; } = null!;

    [Column(TypeName = "varchar(500)")]
    public string? CommentBlock { get; set; }

    [Column(TypeName = "varchar(500)")]
    public string? CommentUnblock { get; set; }

    [Required]
    public bool Active { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    [ForeignKey("CreatedByUserId")]
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    [Required]
    public DateTimeOffset DateModified { get; set; }

    [Required]
    [ForeignKey("ModifiedByUserId")]
    public Guid ModifiedByUserId { get; set; }
    public User ModifiedByUser { get; set; } = null!;
  }
}
