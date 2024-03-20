using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Lookups.Entities
{
  [Table("Language", Schema = "Lookup")]
  [Index(nameof(Name), IsUnique = true)]
  [Index(nameof(CodeAlpha2), IsUnique = true)]
  public class Language : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; }

    [Required]
    [Column(TypeName = "varchar(2)")]
    public string CodeAlpha2 { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
