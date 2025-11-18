using Newtonsoft.Json;

namespace Yoma.Core.Infrastructure.Keycloak.Models
{
  public class KeycloakWebhookRequest
  {
    [JsonProperty("type")]
    public string Type { get; set; } = null!;

    [JsonProperty("realmId")]
    public string RealmId { get; set; } = null!;

    [JsonProperty("id")]
    public string Id { get; set; } = null!;

    [JsonProperty("time")]
    public long Time { get; set; }

    [JsonProperty("clientId")]
    public string ClientId { get; set; } = null!;

    [JsonProperty("userId")]
    public string UserId { get; set; } = null!;

    [JsonProperty("ipAddress")]
    public string IpAddress { get; set; } = null!;

    [JsonProperty("details")]
    public Details Details { get; set; } = null!;
  }

  public class Details
  {
    [JsonProperty("auth_method")]
    public string Auth_method { get; set; } = null!;

    [JsonProperty("auth_type")]
    public string Auth_type { get; set; } = null!;

    [JsonProperty("identity_provider")]
    public string Identity_provider { get; set; } = null!;

    [JsonProperty("register_method")]
    public string Register_method { get; set; } = null!;

    [JsonProperty("redirect_uri")]
    public string Redirect_uri { get; set; } = null!;

    [JsonProperty("code_id")]
    public string Code_id { get; set; } = null!;

    [JsonProperty("username")]
    public string Username { get; set; } = null!;
  }
}
