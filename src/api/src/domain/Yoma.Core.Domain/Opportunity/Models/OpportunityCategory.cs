namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityCategory
  {
    public Guid Id { get; set; }

    public Guid OpportunityId { get; set; }

    public Guid OpportunityStatusId { get; set; }

    public DateTimeOffset OpportunityDateStart { get; set; }

    public bool? OpporunityHidden { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid OrganizationStatusId { get; set; }

    public Guid CategoryId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
