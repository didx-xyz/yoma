using Yoma.Core.Domain.Analytics.Interfaces;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchFilterYouth : OrganizationSearchFilterBase, IOrganizationSearchFilterEngagement
  {
    public List<Guid>? Countries { get; set; }
  }
}
