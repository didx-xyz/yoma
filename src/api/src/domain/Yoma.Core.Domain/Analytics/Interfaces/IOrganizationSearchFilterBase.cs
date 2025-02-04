namespace Yoma.Core.Domain.Analytics.Interfaces
{
  public interface IOrganizationSearchFilterBase
  {
    List<Guid>? Organizations { get; set; }

    List<Guid>? Opportunities { get; set; }

    List<Guid>? Categories { get; set; }

    DateTimeOffset? StartDate { get; set; }

    DateTimeOffset? EndDate { get; set; }

    void SanitizeCollections();
  }
}
