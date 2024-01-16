using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Interfaces
{
    public interface IWalletService
    {
        (string userEmail, string walletId) GetWalletId(Guid userId);

        (string userEmail, string? walletId) GetWalletIdOrNull(Guid userId);

        Task<(WalletCreationStatus status, WalletBalance balance)> GetWalletStatusAndBalance(Guid userId);

        Task<WalletVoucherSearchResults> SearchVouchers(WalletVoucherSearchFilter filter);

        Task<Wallet> CreateWallet(Guid userId);

        Task CreateWalletOrScheduleCreation(Guid? userId);

        List<WalletCreation> ListPendingCreationSchedule(int batchSize, List<Guid> idsToSkip);

        Task UpdateScheduleCreation(WalletCreation item);
    }
}
