namespace Yoma.Core.Domain.Marketplace.Models.Provider
{
  public sealed class CommitItemReservationRequest
  {
    public string WalletId { get; set; } = null!;

    public string Username { get; set; } = null!;

    public string ItemId { get; set; } = null!;

    public string ReservationId { get; set; } = null!;
  }
}
