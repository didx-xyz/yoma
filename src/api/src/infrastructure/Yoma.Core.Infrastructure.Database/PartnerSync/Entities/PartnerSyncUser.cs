using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.PartnerSync.Entities.Lookups;
using Yoma.Core.Infrastructure.Shared.Entities;

namespace Yoma.Core.Infrastructure.Database.PartnerSync.Entities
{
  [Table("User", Schema = "PartnerSync")]
  [Index(nameof(PartnerId), nameof(UserId), IsUnique = true)]
  [Index(nameof(PartnerId), nameof(Username), IsUnique = true)]
  [Index(nameof(PartnerId), nameof(Email), IsUnique = true)]
  [Index(nameof(PartnerId), nameof(PhoneNumber), IsUnique = true)]
  [Index(nameof(PartnerId), nameof(ExternalId), IsUnique = true)]
  [Index(nameof(PartnerId), nameof(Username), nameof(Email), nameof(PhoneNumber), nameof(ExternalId), nameof(DateCreated), nameof(DateModified))]
  public class PartnerSyncUser : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("PartnerId")]
    public Guid PartnerId { get; set; }
    public Partner Partner { get; set; } = null!;

    [Required]
    [ForeignKey("UserId")]
    public Guid UserId { get; set; }
    public Entity.Entities.User User { get; set; } = null!;

    [Required]
    public string Username { get; set; } = null!;

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public string? ExternalId { get; set; }

    public DateTimeOffset? DateLastRedirect { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }
  }
}
