using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities
{
    [Table("SSISchemaSchemaType", Schema = "SSI")]
    [Index(nameof(SSISchemaName), IsUnique = true)]
    [Index(nameof(SSISchemaTypeId))]
    public class SSISchemaSchemaType : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(255)")]
        public string? SSISchemaName { get; set; }

        [Required]
        [ForeignKey("SSISchemaTypeId")]
        public Guid SSISchemaTypeId { get; set; }
        public SSISchemaType SSISchemaType { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
