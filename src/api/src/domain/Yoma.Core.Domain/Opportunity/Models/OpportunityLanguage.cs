namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityLanguage
  {
    public Guid Id { get; set; }

    public Guid OpportunityId { get; set; }

    public Guid OpportunityStatusId { get; set; }

    public DateTimeOffset OpportunityDateStart { get; set; }

    public Guid OrganizationId { get; set; }

    public Guid OrganizationStatusId { get; set; }

    public Guid LanguageId { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
