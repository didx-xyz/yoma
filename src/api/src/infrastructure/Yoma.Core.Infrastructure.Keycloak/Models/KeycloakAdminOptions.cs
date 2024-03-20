namespace Yoma.Core.Infrastructure.Keycloak.Models
{
  public class KeycloakAdminOptions
  {
    public const string Section = "KeycloakAdmin";

    public KeycloakCredentials Admin { get; set; }

    public KeycloakCredentials WebhookAdmin { get; set; }
  }

  public class KeycloakCredentials
  {
    public string? Realm { get; set; }

    public string Username { get; set; }

    public string Password { get; set; }
  }
}
