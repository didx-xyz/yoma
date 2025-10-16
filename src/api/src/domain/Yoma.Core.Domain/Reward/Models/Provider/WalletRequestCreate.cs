namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public class WalletRequestCreate
  {
    public string Username { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public decimal Balance { get; set; }
  }
}
