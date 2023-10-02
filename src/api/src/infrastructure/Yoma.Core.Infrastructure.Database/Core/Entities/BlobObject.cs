using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Infrastructure.Database.Core.Entities
{
    [Table("Blob", Schema = "Object")]
    [Index(nameof(Key), IsUnique = true)]
    [Index(nameof(StorageType), nameof(FileType))]
    public class BlobObject : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(25)")]
        public string StorageType { get; set; }

        [Required]
        [Column(TypeName = "varchar(25)")]
        public string FileType { get; set; }

        [Required]
        [Column(TypeName = "varchar(125)")]
        public string Key { get; set; }

        [Required]
        [Column(TypeName = "varchar(127)")]
        public string ContentType { get; set; }

        [Required]
        [Column(TypeName = "varchar(255)")]
        public string OriginalFileName { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
