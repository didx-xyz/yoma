using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  internal class AccessTokenResponse
  {
    [JsonProperty("access_token")]
    public string AccessToken { get; set; } = null!;

    [JsonProperty("token_type")]
    public string TokenType { get; set; } = null!;

    [JsonProperty("expires_in")]
    public int ExpiresIn { get; set; }
  }
}
