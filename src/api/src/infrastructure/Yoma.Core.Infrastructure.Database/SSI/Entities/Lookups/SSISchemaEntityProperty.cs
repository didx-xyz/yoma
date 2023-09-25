using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
    [Table("SchemaEntityProperty", Schema = "SSI")]
    [Index(nameof(SSISchemaObjectId), nameof(Name), IsUnique = true)]
    public class SSISchemaEntityProperty : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("SSISchemaObjectId")]
        public Guid SSISchemaObjectId { get; set; }
        public SSISchemaEntity SSISchemaObject { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string Name { get; set; }

        [Required]
        [Column(TypeName = "varchar(125)")]
        public string ValueDescription { get; set; }

        [Required]
        public bool Required { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
