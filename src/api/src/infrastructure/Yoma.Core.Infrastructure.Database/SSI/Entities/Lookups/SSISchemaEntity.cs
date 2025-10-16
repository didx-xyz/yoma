using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
  [Table("SchemaEntity", Schema = "SSI")]
  [Index(nameof(TypeName), IsUnique = true)]
  public class SSISchemaEntity : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(255)")]
    public string TypeName { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    public ICollection<SSISchemaEntityProperty> Properties { get; set; } = null!;

    public ICollection<SSISchemaEntityType> Types { get; set; } = null!;
  }
}
