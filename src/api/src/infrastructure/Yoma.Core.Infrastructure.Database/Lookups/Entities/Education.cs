using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
  [Table("Education", Schema = "Lookup")]
  [Index(nameof(Name), IsUnique = true)]
  public class Education : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
