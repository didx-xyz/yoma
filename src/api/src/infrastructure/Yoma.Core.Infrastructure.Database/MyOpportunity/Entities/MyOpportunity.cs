using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Infrastructure.Database.MyOpportunity.Entities.Lookups;
using Microsoft.EntityFrameworkCore;

namespace Yoma.Core.Infrastructure.Database.MyOpportunity.Entities
{
    [Table("MyOpportunity", Schema = "opportunity")]
    [Index(nameof(UserId), nameof(OpportunityId), nameof(ActionId), IsUnique = true)]
    [Index(nameof(VerificationStatusId), nameof(DateCompleted), nameof(ZltoReward), nameof(YomaReward), nameof(DateCreated), nameof(DateModified))]
    public class MyOpportunity : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("UserId")]
        public Guid UserId { get; set; }
        public User User { get; set; }

        [Required]
        [ForeignKey("OpportunityId")]
        public Guid OpportunityId { get; set; }
        public Opportunity.Entities.Opportunity Opportunity { get; set; }

        [Required]
        [ForeignKey("ActionId")]
        public Guid ActionId { get; set; }
        public MyOpportunityAction Action { get; set; }

        [ForeignKey("VerificationStatusId")]
        public Guid? VerificationStatusId { get; set; }
        public MyOpportunityVerificationStatus? VerificationStatus { get; set; }

        [ForeignKey(nameof(CertificateId))]
        public Guid? CertificateId { get; set; }
        public BlobObject? Certificate { get; set; }

        public DateTimeOffset? DateStart { get; set; }

        public DateTimeOffset? DateEnd { get; set; }

        public DateTimeOffset? DateCompleted { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal? ZltoReward { get; set; }

        [Column(TypeName = "decimal(8,2)")]
        public decimal? YomaReward { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }
    }
}
