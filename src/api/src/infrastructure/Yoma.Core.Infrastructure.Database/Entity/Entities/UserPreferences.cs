using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Entity.Entities
{
  [Table("UserPreferences", Schema = "Entity")]
  public class UserPreferences
  {
    [Key]
    [ForeignKey(nameof(User))]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [ForeignKey(nameof(GoalId))]
    public Guid? GoalId { get; set; }
    public Lookups.UserGoal? Goal { get; set; }

    [ForeignKey(nameof(CommitmentIntervalId))]
    public Guid? CommitmentIntervalId { get; set; }
    public TimeInterval? CommitmentInterval { get; set; }

    public short? CommitmentIntervalCount { get; set; }

    [ForeignKey(nameof(EngagementTypeId))]
    public Guid? EngagementTypeId { get; set; }
    public EngagementType? EngagementType { get; set; }

    public bool? Incentivized { get; set; }

    [Column(TypeName = "varchar(500)")]
    public string? AccessibilityRequirementOtherDescription { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }

    [Required]
    public DateTimeOffset DateModified { get; set; }

    public ICollection<UserPreferenceCategory>? Categories { get; set; }

    public ICollection<UserPreferenceAccessibilityRequirement>? AccessibilityRequirements { get; set; }

    public ICollection<UserPreferenceLanguage>? Languages { get; set; }
  }
}
