using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.Referral.Entities
{
  [Table("ProgramPathway", Schema = "Referral")]
  [Index(nameof(ProgramId), nameof(Name), IsUnique = true)]
  [Index(nameof(ProgramId), nameof(DateCreated), nameof(DateModified))]
  public class ProgramPathway : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("ProgramId")]
    public Guid ProgramId { get; set; }
    public Program Program { get; set; }

    [Required]
    [Column(TypeName = "varchar(255)")] //MS SQL: nvarchar(255)
    public string Name { get; set; }

    [Column(TypeName = "varchar(500)")] //MS SQL: nvarchar(500)
    public string? Description { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<ProgramPathwayStep> Steps { get; set; }
  }
}
