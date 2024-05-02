namespace Yoma.Core.Domain.Analytics.Models
{
  public class OrganizationSearchFilterSSO
  {
    public Guid Organization { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }
  }
}
