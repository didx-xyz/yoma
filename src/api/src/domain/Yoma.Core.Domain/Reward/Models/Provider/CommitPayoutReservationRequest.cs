namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class CommitPayoutReservationRequest
  {
    public string ReservationId { get; set; } = null!;

    public string? ExternalTransactionReference { get; set; }
  }
}
