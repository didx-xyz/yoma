namespace Yoma.Core.Domain.Opportunity.Models.Lookups
{
  public class OpportunityVerificationType
  {
    public Guid Id { get; set; }

    public VerificationType Type { get; set; }

    public string DisplayName { get; set; } = null!;

    public string Description { get; set; } = null!;
  }
}
