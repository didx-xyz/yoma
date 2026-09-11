namespace Yoma.Core.Domain.Reward.Models.Provider
{
  public sealed class UpdateWalletUsernameRequest
  {
    public string UsernameCurrent { get; set; } = null!;

    public string Username { get; set; } = null!;
  }
}
