using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Yoma.Core.Infrastructure.Chimoney.Models
{
  public sealed class WebhookEvent
  {
    [JsonProperty("eventType")]
    public string EventType { get; set; } = null!;

    [JsonProperty("status")]
    public string Status { get; set; } = null!;

    [JsonProperty("message")]
    public string? Message { get; set; }

    // Event-specific payload (varies by event type). We keep it generic.
    [JsonProperty("data")]
    public JToken? Data { get; set; }
  }
}
