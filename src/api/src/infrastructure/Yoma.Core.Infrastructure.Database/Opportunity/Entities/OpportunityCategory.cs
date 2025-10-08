using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
  [Table("OpportunityCategories", Schema = "Opportunity")]
  [Index(nameof(OpportunityId), nameof(CategoryId), IsUnique = true)]
  public class OpportunityCategory : Shared.Entities.BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity Opportunity { get; set; }

    [Required]
    [ForeignKey("CategoryId")]
    public Guid CategoryId { get; set; }
    public Lookups.OpportunityCategory Category { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
