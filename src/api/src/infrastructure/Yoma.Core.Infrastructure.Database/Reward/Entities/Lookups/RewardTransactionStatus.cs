using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Reward.Entities.Lookups
{
    [Table("TransactionStatus", Schema = "Reward")]
    [Index(nameof(Name), IsUnique = true)]
    public class RewardTransactionStatus : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Name { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
