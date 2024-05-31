using Yoma.Core.Domain.Analytics.Interfaces;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchFilterEngagement : IOrganizationSearchFilterEngagement
  {
    public Guid Organization { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public List<Guid>? Categories { get; set; }

    public List<Guid>? Countries { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }
  }
}
