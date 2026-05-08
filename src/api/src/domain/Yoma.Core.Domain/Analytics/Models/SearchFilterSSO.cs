using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public sealed class SearchFilterSSO : PaginationFilter, IHashableObject
  {
    public List<Guid>? Organizations { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public bool SSOEnabledOnly { get; set; } = true;

    public void NormalizeForHashing()
    {
      SanitizeCollections();

      Organizations = Organizations?.OrderBy(o => o).ToList();
    }

    public void SanitizeCollections()
    {
      Organizations = Organizations?.Distinct().ToList();
      if (Organizations?.Count == 0) Organizations = null;
    }
  }
}
