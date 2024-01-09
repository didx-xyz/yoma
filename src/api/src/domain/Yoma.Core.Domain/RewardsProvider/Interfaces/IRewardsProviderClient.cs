using Yoma.Core.Domain.RewardsProvider.Models;

namespace Yoma.Core.Domain.RewardsProvider.Interfaces
{
    public interface IRewardsProviderClient
    {
        Task<Wallet> EnsureWallet(WalletRequestCreate user);

        Task<int> GetBalance(string walletId);
    }
}
