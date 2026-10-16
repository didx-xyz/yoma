using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserPreferenceCategories", Schema = "Entity")]
  [Index(nameof(UserId), nameof(CategoryId), IsUnique = true)]
  public class UserPreferenceCategory : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    public Guid UserId { get; set; }
    [ForeignKey(nameof(UserId))]
    public UserPreferences Preferences { get; set; } = null!;

    [Required]
    [ForeignKey(nameof(CategoryId))]
    public Guid CategoryId { get; set; }
    public Opportunity.Entities.Lookups.OpportunityCategory Category { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
