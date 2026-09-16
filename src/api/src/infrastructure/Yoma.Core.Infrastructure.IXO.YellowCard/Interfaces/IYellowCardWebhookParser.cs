using Yoma.Core.Infrastructure.IXO.YellowCard.Models;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Interfaces
{
  public interface IYellowCardWebhookParser
  {
    /// <summary>
    /// Authenticates the exact request body and maps a valid provider event to the payout domain.
    /// </summary>
    YellowCardWebhookResult Parse(
      string requestBody,
      string? webhookId,
      string? webhookTimestamp,
      string? webhookSignature);
  }
}
