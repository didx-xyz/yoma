namespace Yoma.Core.Domain.Marketplace.Models
{
  public class Store
  {
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? ImageURL { get; set; }
  }
}
