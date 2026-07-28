using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Zlto.Models
{
  public class WalletReservationRequestCreate
  {
    [JsonProperty("wallet_id")]
    public string WalletId { get; set; } = null!;

    [JsonProperty("owner_id")]
    public string OwnerId { get; set; } = null!;

    [JsonProperty("reservation_amount")]
    public int Amount { get; set; }

    [JsonProperty("reservation_currency")]
    public string Currency { get; set; } = null!;

    [JsonProperty("reservation_reason")]
    public string Reason { get; set; } = null!;

    [JsonProperty("reservation_description")]
    public string? Description { get; set; }

    [JsonProperty("external_reference")]
    public string ExternalReference { get; set; } = null!;

    [JsonProperty("idempotency_key")]
    public string IdempotencyKey { get; set; } = null!;

    [JsonProperty("request_reference")]
    public string RequestReference { get; set; } = null!;

    [JsonProperty("expires_at")]
    public DateTimeOffset ExpiresAt { get; set; }

    [JsonProperty("created_by_origin")]
    public string CreatedByOrigin { get; set; } = null!;

    [JsonProperty("created_by_id")]
    public string CreatedById { get; set; } = null!;

    [JsonProperty("created_by_name")]
    public string CreatedByName { get; set; } = null!;
  }

  public class WalletReservationRequestCommit
  {
    [JsonProperty("external_payout_id")]
    public string? ExternalPayoutId { get; set; }

    [JsonProperty("actor_origin")]
    public string ActorOrigin { get; set; } = null!;

    [JsonProperty("actor_id")]
    public string ActorId { get; set; } = null!;

    [JsonProperty("actor_name")]
    public string ActorName { get; set; } = null!;
  }

  public class WalletReservationRequestRelease
  {
    [JsonProperty("reason")]
    public string? Reason { get; set; }

    [JsonProperty("actor_origin")]
    public string ActorOrigin { get; set; } = null!;

    [JsonProperty("actor_id")]
    public string ActorId { get; set; } = null!;

    [JsonProperty("actor_name")]
    public string ActorName { get; set; } = null!;
  }

  public class WalletReservationResponse
  {
    [JsonProperty("reservation_id")]
    public string Id { get; set; } = null!;
  }
}
