namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationSearchFilterOpportunity : OrganizationSearchFilterBase
    {
        public List<string>? AgeRanges { get; set; }

        public List<Guid>? Genders { get; set; }

        public List<Guid>? Countries { get; set; }
    }
}
