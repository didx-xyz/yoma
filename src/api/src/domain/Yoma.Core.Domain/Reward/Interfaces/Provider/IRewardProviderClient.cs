using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;

namespace Yoma.Core.Domain.Reward.Interfaces.Provider
{
    public interface IRewardProviderClient
    {
        Task<(Wallet wallet, Models.Provider.WalletCreationStatus status)> CreateWallet(WalletRequestCreate request);

        Task<Wallet> GetWallet(string walletId);

        Task<List<WalletVoucher>> ListWalletVouchers(string walletId, int? limit, int? offset);
    }
}
