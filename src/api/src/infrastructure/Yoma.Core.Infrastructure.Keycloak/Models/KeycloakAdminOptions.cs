namespace Yoma.Core.Infrastructure.Keycloak.Models
{
  public class KeycloakAdminOptions
  {
    public const string Section = "KeycloakAdmin";

    public KeycloakCredentials Admin { get; set; } = null!;

    public KeycloakCredentials WebhookAdmin { get; set; } = null!;
  }

  public class KeycloakCredentials
  {
    public string? Realm { get; set; }

    public string Username { get; set; } = null!;

    public string Password { get; set; } = null!;
  }
}
