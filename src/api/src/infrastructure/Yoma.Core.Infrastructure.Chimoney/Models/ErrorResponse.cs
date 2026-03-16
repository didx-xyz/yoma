using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Chimoney.Models
{
  public sealed class ErrorResponse
  {
    [JsonProperty("status")]
    public string? Status { get; set; }

    [JsonProperty("type")]
    public string? Type { get; set; }

    [JsonProperty("code")]
    public string? Code { get; set; }

    [JsonProperty("message")]
    public string? Message { get; set; }
  }
}
