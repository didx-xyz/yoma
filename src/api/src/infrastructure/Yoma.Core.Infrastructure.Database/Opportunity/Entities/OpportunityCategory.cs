using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
    [Table("OpportunityCategories", Schema = "Opportunity")]
    [Index(nameof(OpportunityId), nameof(CategoryId), IsUnique = true)]
    public class OpportunityCategory : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("OpportunityID")]
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
