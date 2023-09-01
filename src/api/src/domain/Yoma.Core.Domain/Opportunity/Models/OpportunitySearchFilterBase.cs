using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public abstract class OpportunitySearchFilterBase : PaginationFilter
    {
        public List<Guid>? Types { get; set; }

        public List<Guid>? Categories { get; set; }

        public List<Guid>? Languages { get; set; }

        public List<Guid>? Countries { get; set; }

        public string? ValueContains { get; set; }

        [JsonIgnore]
        internal bool? ValueContainsActiveMatchesOnly { get; set; }
    }
}
