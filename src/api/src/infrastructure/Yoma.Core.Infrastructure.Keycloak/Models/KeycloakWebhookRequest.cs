using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Keycloak.Models
{
  public class KeycloakWebhookRequest
  {
    [JsonProperty("type")]
    public string Type { get; set; }

    [JsonProperty("realmId")]
    public string RealmId { get; set; }

    [JsonProperty("id")]
    public string Id { get; set; }

    [JsonProperty("time")]
    public long Time { get; set; }

    [JsonProperty("clientId")]
    public string ClientId { get; set; }

    [JsonProperty("userId")]
    public string UserId { get; set; }

    [JsonProperty("ipAddress")]
    public string IpAddress { get; set; }

    [JsonProperty("details")]
    public Details Details { get; set; }
  }

  public class Details
  {
    [JsonProperty("auth_method")]
    public string Auth_method { get; set; }

    [JsonProperty("auth_type")]
    public string Auth_type { get; set; }

    [JsonProperty("identity_provider")]
    public string Identity_provider { get; set; }

    [JsonProperty("register_method")]
    public string Register_method { get; set; }

    [JsonProperty("redirect_uri")]
    public string Redirect_uri { get; set; }

    [JsonProperty("code_id")]
    public string Code_id { get; set; }

    [JsonProperty("username")]
    public string Username { get; set; }
  }
}
