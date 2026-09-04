namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class ReleasePayoutReservationRequest
  {
    public string ReservationId { get; set; } = null!;

    public string? Reason { get; set; }
  }
}
