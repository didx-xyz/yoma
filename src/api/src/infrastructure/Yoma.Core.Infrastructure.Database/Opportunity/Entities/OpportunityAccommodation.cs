using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunityAccommodations", Schema = "Opportunity")]
  [Index(nameof(OpportunityId), nameof(AccommodationId), IsUnique = true)]
  public class OpportunityAccommodation : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; } = null!;

    [Required]
    [ForeignKey("AccommodationId")]
    public Guid AccommodationId { get; set; }
    public Database.Lookups.Entities.Accessibility Accommodation { get; set; } = null!;

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
