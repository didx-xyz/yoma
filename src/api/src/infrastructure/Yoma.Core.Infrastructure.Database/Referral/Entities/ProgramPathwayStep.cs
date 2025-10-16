using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("ProgramPathwayStep", Schema = "Referral")]
  [Index(nameof(PathwayId), nameof(Name), IsUnique = true)]
  [Index(nameof(PathwayId), nameof(Order), nameof(DateCreated), nameof(DateModified))]
  public class ProgramPathwayStep : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("PathwayId")]
    public Guid PathwayId { get; set; }
    public ProgramPathway Pathway { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(255)")] //MS SQL: nvarchar(255)
    public string Name { get; set; } = null!;

    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "varchar(10)")]
    public string Rule { get; set; } = null!;

    public byte? Order { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<ProgramPathwayTask> Tasks { get; set; } = null!;
  }
}
