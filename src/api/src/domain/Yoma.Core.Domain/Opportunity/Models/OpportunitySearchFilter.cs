namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunitySearchFilter : OpportunitySearchFilterBase
    {
        /// <summary>
        /// By default only published opportunities are included (active that relates to an active organizations, irrespective of started)
        /// If flagged, the search results will also included expired opportunities (expired that relates to an active organization)
        /// </summary>
        public new bool? IncludeExpired { get; set; }
    }
}
