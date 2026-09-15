namespace Yoma.Core.Domain.Marketplace.Models.Provider
{
  public sealed class ReserveItemRequest
  {
    public string WalletId { get; set; } = null!;

    public string Username { get; set; } = null!;

    public string ItemId { get; set; } = null!;
  }
}
