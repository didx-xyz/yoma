namespace Yoma.Core.Infrastructure.Jobberman.Models
{
  public sealed class JobbermanOptions
  {
    public const string Section = "Jobberman";

    public string BaseUrl { get; set; } = null!;

    public List<JobbermanFeedOptions> Feeds { get; set; } = null!;
  }

  //TODO: Country-specific Yoma organization mapping
  public sealed class JobbermanFeedOptions
  {
    public string CountryCodeAlpha2 { get; set; } = null!;

    public string UrlSuffix { get; set; } = null!;
  }
}

