using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Emsi.Models
{
    public class OAuthResponse
    {
        [JsonProperty("access_token")]
        public string Access_token { get; set; }

        [JsonProperty("expires_in")]
        public int Expires_in { get; set; }

        [JsonProperty("token_type")]
        public string Token_type { get; set; }

        [JsonIgnore]
        public DateTimeOffset Date { get; } = DateTimeOffset.UtcNow;

        [JsonIgnore]
        public DateTimeOffset DateExpire
        {
            get { return Date.AddSeconds(Expires_in - 5); }
        }
    }
}
