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
  }
}
