using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
  [Table("Country", Schema = "Lookup")]
  [Index(nameof(Name), IsUnique = true)]
  [Index(nameof(CodeAlpha2), IsUnique = true)]
  [Index(nameof(CodeAlpha3), IsUnique = true)]
  [Index(nameof(CodeNumeric), IsUnique = true)]
  public class Country : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; }

    [Required]
    [Column(TypeName = "varchar(2)")]
    public string CodeAlpha2 { get; set; }

    [Required]
    [Column(TypeName = "varchar(3)")]
    public string CodeAlpha3 { get; set; }

    [Required]
    [Column(TypeName = "varchar(3)")]
    public string CodeNumeric { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
