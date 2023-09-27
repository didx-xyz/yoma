using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
    [Table("CredentialSchema", Schema = "AriesCloud")]
    [Index(nameof(Name), nameof(ArtifactType))]
    public class CredentialSchema : BaseEntity<string>
    {
        [Required]
        [Column(TypeName = "varchar(125)")]
        public string Name { get; set; }

        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Version { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(MAX)")]
        public string AttributeNames { get; set; }

        [Required]
        [Column(TypeName = "varchar(20)")]
        public string ArtifactType { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
