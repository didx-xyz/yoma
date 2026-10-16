using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunitySustainableDevelopmentGoals", Schema = "Opportunity")]
  [Index(nameof(OpportunityId), nameof(SustainableDevelopmentGoalId), IsUnique = true)]
  public class OpportunitySustainableDevelopmentGoal : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; } = null!;

    [Required]
    [ForeignKey("SustainableDevelopmentGoalId")]
    public Guid SustainableDevelopmentGoalId { get; set; }
    public Database.Lookups.Entities.SustainableDevelopmentGoal SustainableDevelopmentGoal { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
