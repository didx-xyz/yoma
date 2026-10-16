using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserPreferenceEngagementTypes", Schema = "Entity")]
  [Index(nameof(UserId), nameof(EngagementTypeId), IsUnique = true)]
  public class UserPreferenceEngagementType : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    public Guid UserId { get; set; }
    [ForeignKey(nameof(UserId))]
    public UserPreferences Preferences { get; set; } = null!;

    [Required]
    [ForeignKey(nameof(EngagementTypeId))]
    public Guid EngagementTypeId { get; set; }
    public Database.Lookups.Entities.EngagementType EngagementType { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
