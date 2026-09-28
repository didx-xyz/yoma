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
  }
}
