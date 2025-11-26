using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilterCriteria : PaginationFilter
  {
    public List<Guid>? Organizations { get; set; }

    public string? TitleContains { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public List<Guid>? Countries { get; set; }

    public bool? Published { get; set; }

    public bool? VerificationEnabled { get; set; }

    public VerificationMethod? VerificationMethod { get; set; }

    /// <summary>
    /// When true → returns opportunities that youth can currently complete (via the portal or action link).  
    /// Default = false → no filtering / effect.
    ///
    /// Logic aligns with <see cref="Opportunity.OpportunityExtensions.Extensions.EvaluateCompletable"/>:
    /// • Opportunity is Published (Status = Active + Active organization + DateStart ≤ now) OR Status = Expired  
    /// • VerificationEnabled = true  
    /// • VerificationMethod = Manual  
    /// • Not Hidden (null / false)
    ///
    /// Criteria Restrictions: Cannot be combined with Published, VerificationEnabled, or VerificationMethod filters.
    /// </summary>
    public bool OnlyCompletable { get; set; } = false;
  }
}
