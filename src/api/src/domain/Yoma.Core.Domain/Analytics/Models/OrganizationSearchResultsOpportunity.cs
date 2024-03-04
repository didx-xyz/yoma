namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationSearchResultsOpportunity
    {
        public List<OpportunityInfo> Items { get; set; }

        public TimeIntervalSummary Unpublished { get; set; }

        public TimeIntervalSummary Expired { get; set; }

        public int TotalCount { get; set; }

        public DateTimeOffset DateStamp { get; set; }
    }
}
