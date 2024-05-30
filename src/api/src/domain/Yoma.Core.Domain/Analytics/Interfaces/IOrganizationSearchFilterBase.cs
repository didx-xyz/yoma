namespace Yoma.Core.Domain.Analytics.Interfaces
{
  public interface IOrganizationSearchFilterBase
  {
    Guid Organization { get; set; }

    List<Guid>? Opportunities { get; set; }

    List<Guid>? Categories { get; set; }

    List<Guid>? Countries { get; set; }

    DateTimeOffset? StartDate { get; set; }

    DateTimeOffset? EndDate { get; set; }
  }
}
