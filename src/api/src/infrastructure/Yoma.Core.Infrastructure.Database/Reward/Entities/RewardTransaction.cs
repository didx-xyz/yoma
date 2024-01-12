using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Reward.Entities.Lookups;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Domain.Entity.Models;
using Microsoft.EntityFrameworkCore;

namespace Yoma.Core.Infrastructure.Database.Reward.Entities
{
    [Table("Transaction", Schema = "Reward")]
    //unique index declared in OnModelCreating to cater for nullability constraints
    [Index(nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
    public class RewardTransaction : BaseEntity<Guid>
    {
        [ForeignKey("UserId")]
        public Guid UserId { get; set; }
        public User User { get; set; }

        [Required]
        [ForeignKey("StatusId")]
        public Guid StatusId { get; set; }
        public RewardTransactionStatus Status { get; set; }

        [Required]
        [Column(TypeName = "varchar(25)")]
        public string SourceEntityType { get; set; }

        [ForeignKey("MyOpportunityId")]
        public Guid? MyOpportunityId { get; set; }
        public MyOpportunity.Entities.MyOpportunity? MyOpportunity { get; set; }

        [Required]
        [Column(TypeName = "decimal(8,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? TransactionId { get; set; }

        [Column(TypeName = "varchar(MAX)")]
        public string? ErrorReason { get; set; }

        public byte? RetryCount { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }
    }
}
