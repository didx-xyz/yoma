using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Referral.Entities.Lookups;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("Link", Schema = "Referral")]
  [Index(nameof(Name), nameof(UserId), IsUnique = true)]
  [Index(nameof(URL), IsUnique = true)]
  [Index(nameof(ShortURL), IsUnique = true)]
  [Index(nameof(UserId), nameof(ProgramId), nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
  public class Link : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(255)")] //MS SQL: nvarchar(255)
    public string Name { get; set; }

    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string? Description { get; set; }

    [Required]
    [ForeignKey("ProgramId")]
    public Guid ProgramId { get; set; }
    public Program Program { get; set; }

    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public User User { get; set; }

    [Required]
    [ForeignKey("StatusId")]
    public Guid StatusId { get; set; }
    public LinkStatus Status { get; set; }

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string URL { get; set; }

    [Required]
    [Column(TypeName = "varchar(2048)")]
    public string ShortURL { get; set; }

    public int? CompletionTotal { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
