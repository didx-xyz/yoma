namespace Yoma.Core.Domain.MyOpportunity.Models
{
    public class MyOpportunitySearchFilterAdmin : MyOpportunitySearchFilterBase
    {
        public Guid? UserId { get; set; }

        public Guid? OpportunityId { get; set; }

        public string? ValueContains { get; set; }
    }
}
