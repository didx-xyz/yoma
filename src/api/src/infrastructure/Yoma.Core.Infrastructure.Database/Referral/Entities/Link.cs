using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Referral.Entities.Lookups;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("Link", Schema = "Referral")]
  [Index(nameof(Name), nameof(ProgramId), nameof(UserId), IsUnique = true)]
  [Index(nameof(URL), IsUnique = true)]
  [Index(nameof(ShortURL), IsUnique = true)]
  [Index(nameof(UserId), nameof(ProgramId), nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
  public class Link : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(255)")] //MS SQL: nvarchar(255)
    public string Name { get; set; } = null!;

    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string? Description { get; set; }

    [Required]
    [ForeignKey("ProgramId")]
    public Guid ProgramId { get; set; }
    public Program Program { get; set; } = null!;

    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public LinkStatus Status { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string URL { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string ShortURL { get; set; } = null!;

    public int? CompletionTotal { get; set; }


    [Column(TypeName = "decimal(12,2)")]
    public decimal? ZltoRewardCumulative { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<LinkUsage>? Usages { get; set; }
  }
}
