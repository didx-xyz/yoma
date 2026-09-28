namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilterCountry
  {
    public Guid CountryId { get; set; }

    /// <summary>
    /// Case-insensitive contains match within this country; unspecified regions remain included.
    /// When city is also supplied, both conditions must match the same country mapping.
    /// Cannot be combined with coordinates and radius.
    /// </summary>
    public string? Region { get; set; }

    /// <summary>
    /// Case-insensitive contains match within this country; unspecified cities remain included.
    /// When region is also supplied, both conditions must match the same country mapping.
    /// Cannot be combined with coordinates and radius.
    /// </summary>
    public string? City { get; set; }

    /// <summary>
    /// Search centre in longitude, latitude order. Supply together with RadiusKm,
    /// without region or city filters.
    /// </summary>
    public double[]? Coordinates { get; set; }

    /// <summary>
    /// Search radius in kilometres within this country. Requires the search centre coordinates
    /// and matches only opportunities with known coordinates. Cannot be combined with region or city.
    /// </summary>
    public double? RadiusKm { get; set; }
  }
}
