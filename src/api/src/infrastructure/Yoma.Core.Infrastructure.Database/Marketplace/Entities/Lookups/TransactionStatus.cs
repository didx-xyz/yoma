using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Entities.Lookups
{
    [Table("TransactionStatus", Schema = "Marketplace")]
    [Index(nameof(Name), IsUnique = true)]
    public class TransactionStatus : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(30)")]
        public string Name { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
