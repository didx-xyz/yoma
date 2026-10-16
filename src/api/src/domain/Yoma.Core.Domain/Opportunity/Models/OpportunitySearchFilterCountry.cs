using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilterCountry
  {
    public Guid CountryId { get; set; }

    public SearchCriterion<string>? Region { get; set; }

    public SearchCriterion<string>? City { get; set; }

    /// <summary>
    /// Radius is an alternative to text location criteria. Missing coordinates
    /// follow the explicit policy; distances use kilometres around longitude/latitude.
    /// </summary>
    public SearchCriterion<OpportunitySearchRadius>? Radius { get; set; }
  }

  public sealed class OpportunitySearchRadius
  {
    public double[] Coordinates { get; set; } = null!;

    public double RadiusKm { get; set; }
  }
}
