namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationSearchFilterQueryTerm
    {
        public Guid Organization { get; set; }

        public List<Guid>? Opportunities { get; set; }

        public List<Guid>? Categories { get; set; }

        public DateTimeOffset StartDate { get; set; }

        public DateTimeOffset EndDate { get; set; }

        public List<string>? AgeRanges { get; set; }

        public List<Guid>? Genders { get; set; }

        public List<Guid>? Countries { get; set; }
    }
}
