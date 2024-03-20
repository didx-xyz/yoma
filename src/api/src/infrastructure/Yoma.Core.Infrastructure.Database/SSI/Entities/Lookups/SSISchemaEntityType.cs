using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
  [Table("SchemaEntityType", Schema = "SSI")]
  [Index(nameof(SSISchemaEntityId), nameof(SSISchemaTypeId), IsUnique = true)]
  public class SSISchemaEntityType : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("SSISchemaEntityId")]
    public Guid SSISchemaEntityId { get; set; }
    public SSISchemaEntity SSISchemaEntity { get; set; }

    [Required]
    [ForeignKey("SSISchemaTypeId")]
    public Guid SSISchemaTypeId { get; set; }
    public SSISchemaType SSISchemaType { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
