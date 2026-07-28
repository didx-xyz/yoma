namespace Yoma.Core.Domain.Marketplace.Models.Provider
{
  public sealed class ReleaseItemReservationRequest
  {
    public string ItemId { get; set; } = null!;

    public string ReservationId { get; set; } = null!;
  }
}
