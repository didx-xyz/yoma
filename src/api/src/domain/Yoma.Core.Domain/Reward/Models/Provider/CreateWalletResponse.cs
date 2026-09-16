namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class CreateWalletResponse
  {
    public Wallet Wallet { get; set; } = null!;

    public WalletCreationStatus Status { get; set; }
  }
}
