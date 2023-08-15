namespace Yoma.Core.Domain.Opportunity.Models
{
  public class OpportunityLanguage
  {
    public Guid Id { get; set; }

    public Guid OpportunityId { get; set; }

    public Guid LanguageId { get; set; }

    public string Language { get; set; }

    public string LanguageCodeAlpha2 { get; set; }

    public DateTimeOffset DateCreated { get; set; }
  }
}
