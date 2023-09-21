using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
    [Table("OpportunityVerificationTypes", Schema = "Opportunity")]
    [Index(nameof(OpportunityId), nameof(VerificationTypeId), IsUnique = true)]
    public class OpportunityVerificationType : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("OpportunityID")]
        public Guid OpportunityId { get; set; }
        public Opportunity Opportunity { get; set; }

        [Required]
        [ForeignKey("VerificationTypeId")]
        public Guid VerificationTypeId { get; set; }
        public Lookups.OpportunityVerificationType VerificationType { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? Description { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
