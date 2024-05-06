using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunitySearchFilterCriteria : PaginationFilter
  {
    public Guid? Organization { get; set; }

    public string? TitleContains { get; set; }

    public List<Guid>? Opportunities { get; set; }

    public bool? Published { get; set; }

    public VerificationMethod? VerificationMethod { get; set; }
  }
}
