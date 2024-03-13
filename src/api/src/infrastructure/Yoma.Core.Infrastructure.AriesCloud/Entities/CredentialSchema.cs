using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.AriesCloud.Entities
{
    [Table("CredentialSchema", Schema = "AriesCloud")]
    [Index(nameof(Name), nameof(Version), nameof(ArtifactType))]
    public class CredentialSchema : BaseEntity<string>
    {
        [Column(TypeName = "varchar(125)")]
        public override string Id { get; set; }

        [Required]
        [Column(TypeName = "varchar(125)")]
        public string Name { get; set; }

        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Version { get; set; }

        [Required]
        [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
        public string AttributeNames { get; set; }

        [Required]
        [Column(TypeName = "varchar(20)")]
        public string ArtifactType { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
