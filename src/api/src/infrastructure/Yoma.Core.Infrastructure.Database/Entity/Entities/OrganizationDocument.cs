using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
    [Table("OrganizationDocuments", Schema = "Entity")]
    [Index(nameof(FileId), IsUnique = true)]
    [Index(nameof(OrganizationId), nameof(Type), nameof(DateCreated))]
    public class OrganizationDocument : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("OrganizationId")]
        public Guid OrganizationId { get; set; }
        public Organization Organization { get; set; }

        [Required]
        [ForeignKey("FileId")]
        public Guid FileId { get; set; }
        public BlobObject File { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string Type { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
