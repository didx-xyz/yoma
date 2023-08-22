namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunitySearchFilter : OpportunitySearchFilterBase
    {
        public DateTimeOffset? StartDate { get; set; }

        public DateTimeOffset? EndDate { get; set; }

        public List<Guid>? OrganizationIds { get; set; }

        public List<Status>? Statuses { get; set; }
    }
}
