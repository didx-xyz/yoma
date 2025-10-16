namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreItemCategory
  {
    public string Id { get; set; } = null!;

    public string StoreId { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Summary { get; set; } = null!;

    public string? ImageURL { get; set; }

    public decimal Amount { get; set; }

    public int Count { get; set; }

    public StoreAccessControlRuleEvaluationResult? StoreAccessControlRuleResult { get; set; }
  }
}
