using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities.Lookups
{
    [Table("OpportunityStatus", Schema = "opportunity")]
    [Index(nameof(Name), IsUnique = true)]
    public class OpportunityStatus : BaseEntity<Guid>
    {
        [Required]
        [Column(TypeName = "varchar(20)")]
        public string Name { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
