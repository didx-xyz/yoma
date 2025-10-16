namespace Yoma.Core.Infrastructure.Zlto.Models
{
  public class ZltoOptions
  {
    public const string Section = "Zlto";

    public string Username { get; set; } = null!;

    public string Password { get; set; } = null!;

    public string ApiKeyHeaderName { get; set; } = null!;

    public string ApiKey { get; set; } = null!;

    public int PartnerTokenExpirationIntervalInHours { get; set; }

    public Partner Partner { get; set; } = null!;

    public Wallet Wallet { get; set; } = null!;

    public Store Store { get; set; } = null!;

    public Task Task { get; set; } = null!;

    public bool CalculateStoreItemCategoryCount { get; set; } = false;
  }

  public class Partner
  {
    public string BaseUrl { get; set; } = null!;
  }

  public class Wallet
  {
    public string BaseUrl { get; set; } = null!;
  }

  public class Store
  {
    public string BaseUrl { get; set; } = null!;

    public List<StoreOwner> Owners { get; set; } = null!;
  }

  public class Task
  {
    public string BaseUrl { get; set; } = null!;
  }

  public class StoreOwner
  {
    public string CountryCodeAlpha2 { get; set; } = null!;

    public string Id { get; set; } = null!;
  }
}
