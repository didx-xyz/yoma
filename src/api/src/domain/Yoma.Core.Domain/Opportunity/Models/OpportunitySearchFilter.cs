namespace Yoma.Core.Domain.Opportunity.Models
{
    public class OpportunitySearchFilter : OpportunitySearchFilterBase
    {
        /// <summary>
        /// Optionally defines the published states to filter opportunities. Results are always associated with an active organization. By default active (published) opportunities are included,
        /// irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable
        /// </summary>
        public new List<PublishedState>? PublishedStates { get; set; }

        /// <summary>
        /// Filter results by the most viewed / popular opportunities
        /// </summary>
        public bool? MostViewed { get; set; }
    }
}
