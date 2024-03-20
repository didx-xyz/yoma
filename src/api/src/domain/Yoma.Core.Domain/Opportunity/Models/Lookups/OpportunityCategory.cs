namespace Yoma.Core.Domain.Opportunity.Models.Lookups
{
  public class OpportunityCategory
  {
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string ImageURL { get; set; }

    public int? Count { get; set; }
  }
}
