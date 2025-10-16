using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
  [Table("Language", Schema = "Lookup")]
  [Index(nameof(Name), IsUnique = true)]
  [Index(nameof(CodeAlpha2), IsUnique = true)]
  public class Language : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; } = null!;

    [Required]
    [Column(TypeName = "varchar(2)")]
    public string CodeAlpha2 { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
