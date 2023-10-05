using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Yoma.Core.Infrastructure.Database.Core.Entities;
using Yoma.Core.Infrastructure.Database.Lookups.Entities;

namespace Yoma.Core.Infrastructure.Database.Opportunity.Entities
{
    [Table("OpportunityCountries", Schema = "Opportunity")]
    [Index(nameof(OpportunityId), nameof(CountryId), IsUnique = true)]
    public class OpportunityCountry : BaseEntity<Guid>
    {
        [Required]
        [ForeignKey("OpportunityId")]
        public Guid OpportunityId { get; set; }
        public Opportunity Opportunity { get; set; }

        [Required]
        [ForeignKey("CountryId")]
        public Guid CountryId { get; set; }
        public Country Country { get; set; }

        [Required]
        public DateTimeOffset DateCreated { get; set; }
    }
}
