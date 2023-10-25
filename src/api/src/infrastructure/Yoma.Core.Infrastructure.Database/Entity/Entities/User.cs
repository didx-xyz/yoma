using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
    [Table("User", Schema = "Entity")]
    [Index(nameof(Email), IsUnique = true)]
    [Index(nameof(FirstName), nameof(Surname), nameof(EmailConfirmed), nameof(PhoneNumber), nameof(ExternalId),
        nameof(ZltoWalletId), nameof(DateZltoWalletCreated), nameof(YoIDOnboarded), nameof(SSITenantId), nameof(DateSSITenantCreated), nameof(DateCreated), nameof(DateModified))]
    public class User : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(320)")]
        public string Email { get; set; }

        [Required]
        public bool EmailConfirmed { get; set; }

        [Required]
        [Column(TypeName = "varchar(125)")]
        public string FirstName { get; set; }

        [Required]
        [Column(TypeName = "varchar(125)")]
        public string Surname { get; set; }

        [Required]
        [Column(TypeName = "varchar(255)")]
        public string DisplayName { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? PhoneNumber { get; set; }

        [ForeignKey("CountryId")]
        public Guid? CountryId { get; set; }
        public Country? Country { get; set; }

        [ForeignKey("CountryOfResidenceId")]
        public Guid? CountryOfResidenceId { get; set; }
        public Country? CountryOfResidence { get; set; }

        [ForeignKey(nameof(PhotoId))]
        public Guid? PhotoId { get; set; }
        public BlobObject? Photo { get; set; }

        [ForeignKey("GenderId")]
        public Guid? GenderId { get; set; }
        public Gender? Gender { get; set; }

        public DateTimeOffset? DateOfBirth { get; set; }

        public DateTimeOffset? DateLastLogin { get; set; }

        public Guid? ExternalId { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? ZltoWalletId { get; set; }

        public DateTimeOffset? DateZltoWalletCreated { get; set; }

        public bool? YoIDOnboarded { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? SSITenantId { get; set; }

        public DateTimeOffset? DateSSITenantCreated { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }

        public ICollection<UserSkill> Skills { get; set; }
    }
}
