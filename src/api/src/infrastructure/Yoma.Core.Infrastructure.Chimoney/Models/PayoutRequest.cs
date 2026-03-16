using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Chimoney.Models
{
  public sealed class PayoutRequest
  {
    [JsonProperty("subAccount")]
    public string? SubAccount { get; set; }

    [JsonProperty("chimoneys")]
    public List<PayoutRequestItem> Chimoneys { get; set; } = null!;

    [JsonProperty("turnOffNotification")]
    public bool TurnOffNotification { get; set; }
  }

  public sealed class PayoutRequestItem
  {
    [JsonProperty("email")]
    public string? Email { get; set; }

    [JsonProperty("phone")]
    public string? Phone { get; set; }

    [JsonProperty("valueInUSD")]
    public decimal ValueInUSD { get; set; }

    [JsonProperty("narration")]
    public string? Narration { get; set; }

    [JsonProperty("collectionPaymentIssueID")]
    public string? CollectionPaymentIssueID { get; set; }

    [JsonProperty("amount")]
    public decimal? Amount { get; set; }

    [JsonProperty("currency")]
    public string? Currency { get; set; }
  }
}
