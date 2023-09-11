using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Entities
{
    [Table("MyOpportunityVerifications", Schema = "opportunity")]
    [Index(nameof(MyOpportunityId), nameof(VerificationTypeId), IsUnique = true)]

    public class MyOpportunityVerification : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("MyOpportunityId")]
        public Guid MyOpportunityId { get; set; }
        public MyOpportunity MyOpportunity { get; set; }

        [Required]
        [ForeignKey("VerificationTypeId")]
        public Guid VerificationTypeId { get; set; }
        public Opportunity.Entities.Lookups.OpportunityVerificationType VerificationType { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? GeometryProperties { get; set; }

        [ForeignKey("FileId")]
        public Guid? FileId { get; set; }
        public BlobObject? File { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
