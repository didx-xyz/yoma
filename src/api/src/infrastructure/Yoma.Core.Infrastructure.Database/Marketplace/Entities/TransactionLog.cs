using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;
using Yoma.Core.Infrastructure.Database.Marketplace.Entities.Lookups;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Entities
{
    [Table("TransactionLog", Schema = "Marketplace")]
    [Index(nameof(UserId), nameof(ItemId), nameof(StatusId), IsUnique = true)]
    [Index(nameof(DateCreated), nameof(DateModified))]
    public class TransactionLog : BaseEntity<Guid>
    {
        [ForeignKey("UserId")]
        public Guid UserId { get; set; }
        public User User { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string ItemId { get; set; }

        [Required]
        [ForeignKey("StatusId")]
        public Guid StatusId { get; set; }
        public TransactionStatus Status { get; set; }

        [Required]
        [Column(TypeName = "decimal(8,2)")]
        public decimal Amount { get; set; }

        [Required]
        [Column(TypeName = "varchar(50)")]
        public string TransactionId { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }
    }
}
