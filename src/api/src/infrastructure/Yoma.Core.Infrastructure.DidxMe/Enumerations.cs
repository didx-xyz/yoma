namespace Yoma.Core.Infrastructure.DidxMe
{
  // Adapter progress only; domain scheduling and Replay statuses remain unchanged.
  public enum IssuanceStatus
  {
    Prepared,
    Offered,
    Delivering,
    Accepted,
    Deleted
  }

  public enum IssuerCredentialStatus
  {
    Offered,
    Issued,
    Revoked
  }

  public enum WalletCredentialStatus
  {
    Pending,
    Accepted,
    Rejected
  }
}
