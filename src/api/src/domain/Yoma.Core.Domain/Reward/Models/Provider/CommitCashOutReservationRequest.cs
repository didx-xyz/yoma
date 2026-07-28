namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class CommitCashOutReservationRequest
  {
    public string ReservationId { get; set; } = null!;

    public string? ExternalTransactionReference { get; set; }
  }
}
