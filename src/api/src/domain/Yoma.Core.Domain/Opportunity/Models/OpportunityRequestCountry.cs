namespace Yoma.Core.Domain.Opportunity.Models
{
  /// <summary>
  /// A selected country and its optional location details; one entry per country per opportunity.
  /// Worldwide supports no region, city or coordinates. Assigning an existing country replaces
  /// its location details, including clearing any omitted values.
  /// </summary>
  public class OpportunityRequestCountry
  {
    public Guid CountryId { get; set; }

    public string? Region { get; set; }

    public string? City { get; set; }

    /// <summary>
    /// Location coordinates in longitude, latitude order.
    /// Distance is a search parameter, not stored location data.
    /// </summary>
    public double[]? Coordinates { get; set; }
  }
}
