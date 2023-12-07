using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
    [Table("Organization", Schema = "Entity")]
    [Index(nameof(Name), IsUnique = true)]
    [Index(nameof(StatusId), nameof(DateStatusModified), nameof(DateCreated), nameof(CreatedByUserId), nameof(DateModified), nameof(ModifiedByUserId))]
    public class Organization : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string Name { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(128)")]
        public string NameHashValue { get; set; }   

        [Column(TypeName = "varchar(2048)")]
        public string? WebsiteURL { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? PrimaryContactName { get; set; }

        [Column(TypeName = "varchar(320)")]
        public string? PrimaryContactEmail { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? PrimaryContactPhone { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? VATIN { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? TaxNumber { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? RegistrationNumber { get; set; }

        [Column(TypeName = "varchar(50)")]
        public string? City { get; set; }

        [ForeignKey("CountryId")]
        public Guid? CountryId { get; set; }
        public Country? Country { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? StreetAddress { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? Province { get; set; }

        [Column(TypeName = "varchar(10)")]
        public string? PostalCode { get; set; }

        [Column(TypeName = "nvarchar(MAX)")]
        public string? Tagline { get; set; }

        [Column(TypeName = "nvarchar(MAX)")]
        public string? Biography { get; set; }

        [Required]
        [ForeignKey("StatusId")]
        public Guid StatusId { get; set; }
        public Lookups.OrganizationStatus Status { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? CommentApproval { get; set; }

        public DateTimeOffset? DateStatusModified { get; set; }

        [ForeignKey(nameof(LogoId))]
        public Guid? LogoId { get; set; }
        public BlobObject? Logo { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }

        [Required]
        [ForeignKey("CreatedByUserId")]
        public Guid CreatedByUserId { get; set; }
        public User CreatedByUser { get; set; }

        [Required]
        public DateTimeOffset DateModified { get; set; }

        [Required]
        [ForeignKey("ModifiedByUserId")]
        public Guid ModifiedByUserId { get; set; }
        public User ModifiedByUser { get; set; }

        public ICollection<OrganizationProviderType> ProviderTypes { get; set; }

        public ICollection<OrganizationDocument> Documents { get; set; }

        public ICollection<OrganizationUser> Administrators { get; set; }
    }
}
