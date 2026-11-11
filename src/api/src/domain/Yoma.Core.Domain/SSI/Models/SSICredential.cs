namespace Yoma.Core.Domain.SSI.Models
{
  public class SSICredential : SSICredentialBase
  {
    /// <summary>
    /// Detail-only verification presentation status, separate from the provider lifecycle status.
    /// Relies on provider issuance/receipt verification and current lifecycle checks, not a fresh proof.
    /// </summary>
    public CredentialVerificationStatus VerificationStatus { get; set; }
  }
}
