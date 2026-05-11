using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public abstract class SearchFilterBase : PaginationFilter, IOrganizationSearchFilterBase, IHashableObject
  {
    public List<Guid>? Organizations { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public List<Guid>? Categories { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public virtual void NormalizeForHashing()
    {
      SanitizeCollections();

      Organizations = Organizations?.OrderBy(o => o).ToList();

      Opportunities = Opportunities?.OrderBy(o => o).ToList();

      Categories = Categories?.OrderBy(o => o).ToList();
    }

    public virtual void SanitizeCollections()
    {
      Organizations = Organizations?.Distinct().ToList();
      if (Organizations?.Count == 0) Organizations = null;

      Opportunities = Opportunities?.Distinct().ToList();
      if (Opportunities?.Count == 0) Opportunities = null;

      Categories = Categories?.Distinct().ToList();
      if (Categories?.Count == 0) Categories = null;
    }
  }
}
