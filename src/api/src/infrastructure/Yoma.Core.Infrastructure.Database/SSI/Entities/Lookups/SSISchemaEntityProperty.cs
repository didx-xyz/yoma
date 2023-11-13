using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
    [Table("SchemaEntityProperty", Schema = "SSI")]
    [Index(nameof(SSISchemaEntityId), nameof(Name), IsUnique = true)]
    public class SSISchemaEntityProperty : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("SSISchemaEntityId")]
        public Guid SSISchemaEntityId { get; set; }
        public SSISchemaEntity SSISchemaEntity { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string Name { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string NameDisplay { get; set; }

        [Required]
        [Column(TypeName = "varchar(125)")]
        public string Description { get; set; }

        [Required]
        public bool Required { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? SystemType { get; set; }

        [Column(TypeName = "varchar(125)")]
        public string? Format { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
