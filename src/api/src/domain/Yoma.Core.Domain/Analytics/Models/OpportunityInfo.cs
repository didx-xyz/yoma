namespace Yoma.Core.Domain.Analytics.Models
{
    public class OpportunityInfo
    {
        public Guid Id { get; set; }

        public string Title { get; set; }

        public string? OrganizationLogoURL { get; set; }

        public int ViewedCount { get; set; }

        public decimal ConversionRatio { get; set; }

        public int CompletedCount { get; set; }
    }
}
