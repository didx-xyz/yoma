namespace Yoma.Core.Infrastructure.Chimoney.Models
{
  public sealed class ChimoneyOptions
  {
    public const string Section = "Chimoney";

    public string BaseUrl { get; set; } = null!;

    public string ApiKeyHeaderName { get; set; } = null!;

    public string ApiKey { get; set; } = null!;

    // Svix webhook verification (required)
    public string WebhookSigningSecret { get; set; } = null!;
  }
}
