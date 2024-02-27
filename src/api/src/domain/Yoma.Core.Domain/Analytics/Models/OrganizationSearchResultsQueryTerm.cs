namespace Yoma.Core.Domain.Analytics.Models
{
    public class OrganizationSearchResultsQueryTerm
    {
        public Tuple<string, int> Items { get; set; } //v3.1

        public DateTimeOffset DateStamp { get; set; }
    }
}
