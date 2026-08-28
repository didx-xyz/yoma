using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.IXO.YellowCard.Models
{
  public sealed class YellowCardWebhookEvent
  {
    [JsonProperty("eventId")]
    public string EventId { get; set; } = null!;

    [JsonProperty("yomaTransactionId")]
    public string YomaTransactionId { get; set; } = null!;

    [JsonProperty("providerTransactionId")]
    public string ProviderTransactionId { get; set; } = null!;

    [JsonProperty("status")]
    public string Status { get; set; } = null!;

    [JsonProperty("occurredAt")]
    public string OccurredAt { get; set; } = null!;

    [JsonProperty("errorReason")]
    public string? ErrorReason { get; set; }
  }

  public sealed class YellowCardWebhookResult
  {
    public string EventId { get; set; } = null!;

    public DateTimeOffset OccurredAt { get; set; }

    public Domain.Payout.Models.Provider.PayoutStatusResponse PayoutStatus { get; set; } = null!;
  }
}
