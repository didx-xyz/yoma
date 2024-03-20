using Yoma.Core.Domain.Opportunity;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class YouthInfo
  {
    public Guid UserId { get; set; }

    public string UserDisplayName { get; set; }

    public Guid OpportunityId { get; set; }

    public string OpportunityTitle { get; set; }

    public Status OpportunityStatus { get; set; }

    public Guid? OrganizationLogoId { get; set; }

    public string? OrganizationLogoURL { get; set; }

    public DateTimeOffset? DateCompleted { get; set; }

    public bool Verified { get; set; }
  }
}
