namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class ReservePayoutResponse
  {
    /// <summary>
    /// ZLTO reservation identifier required for retrieval, commit and release. ZLTO does not currently expose
    /// recovery by the idempotency key or external reference, so this must be persisted before payout initiation.
    /// </summary>
    public string Id { get; set; } = null!;
  }
}
