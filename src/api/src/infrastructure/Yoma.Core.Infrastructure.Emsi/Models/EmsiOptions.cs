namespace Yoma.Core.Infrastructure.Emsi.Models
{
  public class EmsiOptions
  {
    public const string Section = "Emsi";

    public string BaseUrl { get; set; } = null!;

    public string AuthUrl { get; set; } = null!;

    public string ClientId { get; set; } = null!;

    public string ClientSecret { get; set; } = null!;
  }
}
