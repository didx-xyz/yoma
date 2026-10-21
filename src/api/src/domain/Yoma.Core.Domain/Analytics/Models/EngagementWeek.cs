namespace Yoma.Core.Domain.Analytics.Models
{
  /// <summary>
  /// Query-only projection shared by weekly engagement and skill aggregation.
  /// Not persisted or exposed in API responses.
  /// </summary>
  internal sealed class EngagementWeek
  {
    public Guid OpportunityId { get; set; }

    /// <summary>
    /// Zero-based Gregorian day number of the week-ending Sunday.
    /// </summary>
    public int DayNumber { get; set; }
  }
}
