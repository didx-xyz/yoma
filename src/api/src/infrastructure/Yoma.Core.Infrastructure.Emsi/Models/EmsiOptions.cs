namespace Yoma.Core.Infrastructure.Emsi.Models
{
  public class EmsiOptions
  {
    public const string Section = "Emsi";

    public string BaseUrl { get; set; }

    public string AuthUrl { get; set; }

    public string ClientId { get; set; }

    public string ClientSecret { get; set; }
  }
}
