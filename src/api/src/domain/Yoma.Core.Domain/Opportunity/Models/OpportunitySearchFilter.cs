using System.Text.Json.Serialization;

namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunitySearchFilter : OpportunitySearchFilterBase
    {
        public DateTimeOffset? StartDate { get; set; }

        public DateTimeOffset? EndDate { get; set; }

        public List<Guid>? Organizations { get; set; }

        public List<Status>? Statuses { get; set; }

        [JsonIgnore]
        //used by info search to only return implicitly active opportunities, thus active and relating to an active organization, irrespective of started
        public bool ImplicitlyActive { get; set; }
    }
}
