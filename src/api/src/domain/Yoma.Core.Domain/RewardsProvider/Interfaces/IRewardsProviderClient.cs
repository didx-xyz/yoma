using Yoma.Core.Domain.RewardsProvider.Models;

namespace Yoma.Core.Domain.RewardsProvider.Interfaces
{
    public interface IRewardsProviderClient
    {
        Task<Wallet> EnsureWallet(WalletRequestCreate user);

        Task<decimal> GetBalance(string walletId);

        Task<List<Transaction>?> ListTransactions(WalletSearchFilter filter);
    }
}
