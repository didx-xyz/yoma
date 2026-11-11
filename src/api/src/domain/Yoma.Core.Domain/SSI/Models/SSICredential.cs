namespace Yoma.Core.Domain.SSI.Models
{
  public class SSICredential : SSICredentialBase
  {
    /// <summary>
    /// Detail-only verification presentation status, separate from the provider lifecycle status.
    /// Currently a compatibility placeholder; actual credential verification is not yet performed.
    /// </summary>
    public CredentialVerificationStatus VerificationStatus { get; set; }
  }
}
