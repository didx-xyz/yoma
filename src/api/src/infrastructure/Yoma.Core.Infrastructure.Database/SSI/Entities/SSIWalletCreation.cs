using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Domain.SSI.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Entity.Entities;

namespace Yoma.Core.Infrastructure.Database.SSI.Entities
{
    [Table("WalletCreation", Schema = "SSI")]
    [Index(nameof(UserId), nameof(UserId), nameof(OrganizationId), IsUnique = true)]
    [Index(nameof(StatusId), nameof(DateCreated), nameof(DateModified))]
    public class SSIWalletCreation : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(25)")]
        public string EntityType { get; set; }

        [Required]
        [ForeignKey("StatusId")]
        public Guid StatusId { get; set; }
        public SSIWalletCreationStatus Status { get; set; }

        [ForeignKey("UserId")]
        public Guid? UserId { get; set; }
        public User? User { get; set; }

        [ForeignKey("OrganizationId")]
        public Guid? OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? WalletId { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? ErrorReason { get; set; }

        public byte? RetryCount { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }
    }
}
