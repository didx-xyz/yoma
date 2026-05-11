using Yoma.Core.Domain.Analytics.Interfaces;

namespace Yoma.Core.Domain.Analytics.Models
{
  public sealed class SearchFilterYouth : SearchFilterBase, IOrganizationSearchFilterEngagement
  {
    public List<Guid>? Countries { get; set; }

    public override void NormalizeForHashing()
    {
      base.NormalizeForHashing();

      Countries = Countries?.OrderBy(o => o).ToList();
    }

    public override void SanitizeCollections()
    {
      base.SanitizeCollections();

      Countries = Countries?.Distinct().ToList();
      if (Countries?.Count == 0) Countries = null;
    }
  }
}
