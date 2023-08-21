using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public abstract class OpportunitySearchFilterBase : PaginationFilter
    {
        public List<Guid>? TypeIds { get; set; }

        public List<Guid>? CategoryIds { get; set; }

        public List<Guid>? LanguageIds { get; set; }

        public List<Guid>? CountryIds { get; set; }

        public string? ValueContains { get; set; }

        [JsonIgnore]
        internal bool? ValueContainsActiveMatchesOnly { get; set; }
    }
}
