using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("User", Schema = "Entity")]
  [Index(nameof(Email), IsUnique = true)]
  [Index(nameof(PhoneNumber), IsUnique = true)]
  [Index(nameof(ExternalId), IsUnique = true)]
  [Index(nameof(FirstName), nameof(Surname), nameof(DisplayName), nameof(EmailConfirmed), nameof(PhoneNumberConfirmed), nameof(DateOfBirth), nameof(DateLastLogin),
    nameof(YoIDOnboarded), nameof(DateYoIDOnboarded), nameof(DateCreated), nameof(DateModified))]
  public class User : Shared.Entities.BaseEntity<Guid>
  {
    [Column(TypeName = "varchar(320)")]
    public string? Email { get; set; }

    public bool? EmailConfirmed { get; set; }

    [Column(TypeName = "varchar(125)")]
    public string? FirstName { get; set; }

    [Column(TypeName = "varchar(125)")]
    public string? Surname { get; set; }

    [Column(TypeName = "varchar(255)")]
    public string? DisplayName { get; set; }

    [Column(TypeName = "varchar(50)")]
    public string? PhoneNumber { get; set; }

    public bool? PhoneNumberConfirmed { get; set; }

    [ForeignKey("CountryId")]
    public Guid? CountryId { get; set; }
    public Country? Country { get; set; }

    [ForeignKey("EducationId")]
    public Guid? EducationId { get; set; }
    public Education? Education { get; set; }

    [ForeignKey(nameof(PhotoId))]
    public Guid? PhotoId { get; set; }
    public BlobObject? Photo { get; set; }

    [ForeignKey("GenderId")]
    public Guid? GenderId { get; set; }
    public Gender? Gender { get; set; }

    public DateTimeOffset? DateOfBirth { get; set; }

    public DateTimeOffset? DateLastLogin { get; set; }

    public Guid? ExternalId { get; set; }

    public bool? YoIDOnboarded { get; set; }

    public DateTimeOffset? DateYoIDOnboarded { get; set; }

    [Column(TypeName = "text")] //MS SQL: nvarchar(MAX)
    public string? Settings { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<UserSkill>? Skills { get; set; }
  }
}
