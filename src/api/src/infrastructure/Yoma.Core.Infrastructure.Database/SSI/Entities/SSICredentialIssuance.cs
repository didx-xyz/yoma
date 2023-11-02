using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities
{
    [Table("CredentialIssuance", Schema = "SSI")]
    //unique index declared in OnModelCreating to cater for nullability constraints
    [Index(nameof(SchemaTypeId), nameof(ArtifactType), nameof(SchemaName), nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
    public class SSICredentialIssuance : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("SchemaTypeId")]
        public Guid SchemaTypeId { get; set; }
        public SSISchemaType SchemaType { get; set; }

        [Required]
        [Column(TypeName = "varchar(25)")]
        public string ArtifactType { get; set; }

        [Required]
        [Column(TypeName = "varchar(125)")]
        public string SchemaName { get; set; }

        [Required]
        [Column(TypeName = "varchar(20)")]
        public string SchemaVersion { get; set; }

        [Required]
        [ForeignKey("StatusId")]
        public Guid StatusId { get; set; }
        public SSICredentialIssuanceStatus Status { get; set; }

        [ForeignKey("UserId")]
        public Guid? UserId { get; set; }
        public User? User { get; set; }

        [ForeignKey("OrganizationId")]
        public Guid? OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        [ForeignKey("MyOpportunityId")]
        public Guid? MyOpportunityId { get; set; }
        public MyOpportunity.Entities.MyOpportunity? MyOpportunity { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? CredentialId { get; set; }

        [Column(TypeName = "varchar(MAX)")]
        public string? ErrorReason { get; set; }

        public byte? RetryCount { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }
    }
}
