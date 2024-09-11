using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Marketplace.Entities
{
  [Table("StoreAccessControlRuleOpportunity", Schema = "Marketplace")]
  [Index(nameof(StoreAccessControlRuleId), nameof(OpportunityId), IsUnique = true)]
  public class StoreAccessControlRuleOpportunity : BaseEntity<Guid>
  {
    [Required]
    [ForeignKey("StoreAccessControlRuleId")]
    public Guid StoreAccessControlRuleId { get; set; }
    public StoreAccessControlRule StoreAccessControlRule { get; set; }

    [Required]
    [ForeignKey("OpportunityId")]
    public Guid OpportunityId { get; set; }
    public Opportunity.Entities.Opportunity Opportunity { get; set; }

    [Required]
    public DateTimeOffset DateCreated { get; set; }
  }
}
