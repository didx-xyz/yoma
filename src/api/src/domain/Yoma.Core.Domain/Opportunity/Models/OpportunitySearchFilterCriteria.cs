using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunitySearchFilterCriteria : PaginationFilter
    {
        public Guid Organization { get; set; }

        public string? TitleContains { get; set; }
    }
}
