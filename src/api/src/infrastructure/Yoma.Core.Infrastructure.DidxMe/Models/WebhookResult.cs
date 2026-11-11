namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  public class WebhookResult
  {
    public string EventId { get; set; } = null!;

    public string IssuanceId { get; set; } = null!;

    public string WalletCredentialId { get; set; } = null!;
  }
}
