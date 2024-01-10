using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Interfaces.Provider
{
    public interface IRewardProviderClient
    {
        Task<Wallet> EnsureWallet(WalletRequestCreate user);

        Task<decimal> GetBalance(string walletId);

        Task<List<WalletVoucher>> ListWalletVouchers(string walletId, int? limit, int? offset);
    }
}
