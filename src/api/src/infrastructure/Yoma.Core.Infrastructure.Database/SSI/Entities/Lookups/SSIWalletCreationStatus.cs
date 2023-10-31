using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities.Lookups
{
    [Table("WalletCreationStatus", Schema = "SSI")]
    [Index(nameof(Name), IsUnique = true)]
    public class SSIWalletCreationStatus : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Name { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
