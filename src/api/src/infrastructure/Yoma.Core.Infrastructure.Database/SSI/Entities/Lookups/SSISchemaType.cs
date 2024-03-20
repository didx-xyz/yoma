using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
  [Table("SchemaType", Schema = "SSI")]
  [Index(nameof(Name), IsUnique = true)]

  public class SSISchemaType : BaseEntity<Guid>
  {
    [Required]
    [Column(TypeName = "varchar(125)")]
    public string Name { get; set; }

    [Required]
    [Column(TypeName = "varchar(255)")]
    public string Description { get; set; }

    [Required]
    public bool SupportMultiple { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
