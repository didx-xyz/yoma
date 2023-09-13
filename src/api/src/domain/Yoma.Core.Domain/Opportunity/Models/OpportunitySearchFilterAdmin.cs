namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunitySearchFilterAdmin : OpportunitySearchFilterBase
    {
        public DateTimeOffset? StartDate { get; set; }

        public DateTimeOffset? EndDate { get; set; }

        public List<Guid>? Organizations { get; set; }

        public List<Status>? Statuses { get; set; }
    }
}
