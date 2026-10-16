using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserPreferenceLanguages", Schema = "Entity")]
  [Index(nameof(UserId), nameof(LanguageId), IsUnique = true)]
  public class UserPreferenceLanguage : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    public Guid UserId { get; set; }
    [ForeignKey(nameof(UserId))]
    public UserPreferences Preferences { get; set; } = null!;

    [Required]
    [ForeignKey(nameof(LanguageId))]
    public Guid LanguageId { get; set; }
    public Database.Lookups.Entities.Language Language { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
