namespace Yoma.Core.Domain.Entity.Models
{
    public class OrganizationSearchResults
    {
        public int? TotalCount { get; set; }

        public List<OrganizationInfo> Items { get; set; }
    }
}
