using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchFilterBase : PaginationFilter, IOrganizationSearchFilterBase
  {
    public List<Guid>? Organizations { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public List<Guid>? Categories { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public void SanitizeCollections()
    {
      Organizations = Organizations?.Distinct().ToList();
      if (Organizations?.Count == 0) Organizations = null;

      Opportunities = Opportunities?.Distinct().ToList();
      if (Opportunities?.Count == 0) Opportunities = null;

      Categories = Categories?.Distinct().ToList();
      Categories = Categories?.Count == 0 ? null : Categories;
    }
  }
}
