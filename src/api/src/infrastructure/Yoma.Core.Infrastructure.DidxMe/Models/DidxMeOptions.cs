namespace Yoma.Core.Infrastructure.DidxMe.Models
{
  public class DidxMeOptions
  {
    public const string Section = "DidxMe";

    public string TenantAlias { get; set; } = null!;

    public string CredentialsBaseUri { get; set; } = null!;

    public string WalletBaseUri { get; set; } = null!;

    public string OnboardingBaseUri { get; set; } = null!;

    public string KeycloakBaseUri { get; set; } = null!;

    public DidxMeIssuerOptions Issuer { get; set; } = new();

    public DidxMeHolderOptions Holder { get; set; } = new();
  }
}
