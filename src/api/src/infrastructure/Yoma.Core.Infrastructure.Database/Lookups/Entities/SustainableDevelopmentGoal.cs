using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
  [Table("SustainableDevelopmentGoal", Schema = "Lookup")]
  [Index(nameof(Name), IsUnique = true)]
  public class SustainableDevelopmentGoal : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    public short Number { get; set; }

    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
