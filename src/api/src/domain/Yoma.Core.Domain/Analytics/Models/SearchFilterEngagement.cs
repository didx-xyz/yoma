using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Analytics.Models
{
  public sealed class SearchFilterEngagement : IOrganizationSearchFilterEngagement, IHashableObject
  {
    public List<Guid>? Organizations { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public List<Guid>? Categories { get; set; }

    public List<Guid>? Countries { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public void NormalizeForHashing()
    {
      SanitizeCollections();

      Organizations = Organizations?.OrderBy(o => o).ToList();
      Opportunities = Opportunities?.OrderBy(o => o).ToList();
      Categories = Categories?.OrderBy(o => o).ToList();
      Countries = Countries?.OrderBy(o => o).ToList();
    }

    public void SanitizeCollections()
    {
      Organizations = Organizations?.Distinct().ToList();
      if (Organizations?.Count == 0) Organizations = null;

      Opportunities = Opportunities?.Distinct().ToList();
      if (Opportunities?.Count == 0) Opportunities = null;

      Categories = Categories?.Distinct().ToList();
      if (Categories?.Count == 0) Categories = null;

      Countries = Countries?.Distinct().ToList();
      if (Countries?.Count == 0) Countries = null;
    }
  }
}
