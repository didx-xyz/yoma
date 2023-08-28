using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
    [Table("Blob", Schema = "object")]
    [Index(nameof(Key), IsUnique = true)]
    public class BlobObject : BaseEntity<Guid>
    {
        [Column(TypeName = "varchar(125)")]
        public string Key { get; set; }

        [Column(TypeName = "varchar(127)")]
        public string ContentType { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string OriginalFileName { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
