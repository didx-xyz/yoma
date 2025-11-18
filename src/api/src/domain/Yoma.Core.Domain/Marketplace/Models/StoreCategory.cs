namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreCategory
  {
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public List<string> StoreImageURLs { get; set; } = null!;
  }
}
