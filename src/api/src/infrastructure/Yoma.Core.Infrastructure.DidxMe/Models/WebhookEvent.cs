namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  /// <summary>
  /// Provider event envelope. Only acceptance correlation is consumed; other event fields are ignored.
  /// </summary>
  public class WebhookEvent
  {
    public string EventType { get; set; } = null!;

    public WebhookEventPayload? Payload { get; set; }

    public WebhookEventTracing? Tracing { get; set; }
  }

  public class WebhookEventPayload
  {
    public string? OpenId4VcIssuanceId { get; set; }
  }

  public class WebhookEventTracing
  {
    public string? ParadymWebhookId { get; set; }
  }
}
