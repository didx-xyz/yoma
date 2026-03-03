using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Chimoney.Models
{
  public sealed class PayoutResponse
  {
    [JsonProperty("status")]
    public string Status { get; set; } = null!;

    [JsonProperty("message")]
    public string Message { get; set; } = null!;

    [JsonProperty("data")]
    public PayoutResponseData? Data { get; set; }
  }

  public sealed class PayoutResponseData
  {
    [JsonProperty("paymentLink")]
    public string? PaymentLink { get; set; }

    [JsonProperty("chimoneys")]
    public List<PayoutResponseDataItem>? Chimoneys { get; set; }

    [JsonProperty("error")]
    public string? Error { get; set; }
  }

  public sealed class PayoutResponseDataItem //TODO: Validate against response
  {
    [JsonProperty("issueID")]
    public string? IssueID { get; set; }
  }
}
