using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
    [Table("Organization", Schema = "Entity")]
    [Index(nameof(Name), IsUnique = true)]
    [Index(nameof(StatusId), nameof(DateStatusModified), nameof(DateModified), nameof(DateCreated))]
    public class Organization : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(255)")]
        public string Name { get; set; }

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
        public Country Country { get; set; }

        [Column(TypeName = "varchar(500)")]
        public string? StreetAddress { get; set; }

        [Column(TypeName = "varchar(255)")]
        public string? Province { get; set; }

        [Column(TypeName = "varchar(10)")]
        public string? PostalCode { get; set; }

        [Column(TypeName = "varchar(MAX)")]
        public string? Tagline { get; set; }

        [Column(TypeName = "varchar(MAX)")]
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
        public DateTimeOffset DateModified { get; set; }

        public ICollection<OrganizationProviderType> ProviderTypes { get; set; }

        public ICollection<OrganizationDocument> Documents { get; set; }

        public ICollection<OrganizationUser> Administrators { get; set; }
    }
}
