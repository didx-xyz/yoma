namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public class WalletRequestCreate
  {
    public string Username { get; set; }

    public string DisplayName { get; set; }

    public decimal Balance { get; set; }
  }
}
