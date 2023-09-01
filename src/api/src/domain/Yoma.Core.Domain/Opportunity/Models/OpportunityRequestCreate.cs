using System.ComponentModel.DataAnnotations;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunityRequestCreate : OpportunityRequestBase
    {
        [Required]
        public bool PostAsActive { get; set; }

        [Required]
        public List<Guid> Categories { get; set; }

        [Required]
        public List<Guid> Countries { get; set; }

        [Required]
        public List<Guid> Languages { get; set; }

        [Required]
        public List<Guid> Skills { get; set; }
    }
}
