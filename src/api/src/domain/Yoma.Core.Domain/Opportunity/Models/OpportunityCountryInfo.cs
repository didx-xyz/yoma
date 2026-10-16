using Newtonsoft.Json;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityCountryInfo : Domain.Lookups.Models.Country
  {
    public string? Region { get; set; }

    public string? City { get; set; }

    /// <summary>
    /// Location coordinates in longitude, latitude order.
    /// </summary>
    public double[]? Coordinates { get; set; }

    /// <summary>
    /// Readable country-scoped location, preserving the association between city, region and country.
    /// Precise coordinates are intentionally excluded from this portable description.
    /// </summary>
    [JsonIgnore]
    public string LocationDisplayName => string.Join(", ", new[] { City, Region, Name }
      .Where(value => !string.IsNullOrWhiteSpace(value))
      .Distinct(StringComparer.OrdinalIgnoreCase));
  }
}
