namespace Yoma.Core.Domain.Analytics.Models
{
    public class OpportunityConversionRate
    {
        public string Legend { get; set; }

        public int CompletedCount { get; set; }

        public int ViewedCount { get; set; }

        public decimal Percentage { get; set; }
    }
}
