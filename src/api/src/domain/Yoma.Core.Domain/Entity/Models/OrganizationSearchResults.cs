namespace Yoma.Core.Domain.Entity.Models
{
  public class OrganizationSearchResults
  {
    public int? TotalCount { get; set; }

    public List<OrganizationInfoAdmin>? Items { get; set; }
  }
}
