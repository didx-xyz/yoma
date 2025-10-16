namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreInfo
  {
    public string Id { get; set; } = null!;

    public string? Name { get; set; }

    public Guid CountryId { get; set; }

    public string CountryName { get; set; } = null!;

    public string CountryCodeAlpha2 { get; set; } = null!;
  }
}
