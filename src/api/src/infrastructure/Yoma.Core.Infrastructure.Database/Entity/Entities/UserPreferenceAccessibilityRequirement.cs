using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserPreferenceAccessibilityRequirements", Schema = "Entity")]
  [Index(nameof(UserId), nameof(AccessibilityId), IsUnique = true)]
  public class UserPreferenceAccessibilityRequirement : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    public Guid UserId { get; set; }
    [ForeignKey(nameof(UserId))]
    public UserPreferences Preferences { get; set; } = null!;

    [Required]
    [ForeignKey(nameof(AccessibilityId))]
    public Guid AccessibilityId { get; set; }
    public Database.Lookups.Entities.Accessibility Accessibility { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
