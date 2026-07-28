namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class ReleaseCashOutReservationRequest
  {
    public string ReservationId { get; set; } = null!;

    public string? Reason { get; set; }
  }
}
