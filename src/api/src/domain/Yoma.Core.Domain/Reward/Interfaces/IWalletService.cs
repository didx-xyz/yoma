using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Interfaces
{
    public interface IWalletService
    {
        string GetWalletId(Guid userId);

        string? GetWalletIdOrNull(Guid userId);

        Task<(WalletCreationStatus status, WalletBalance balance)> GetWalletStatusAndBalance(Guid userId);

        Task<WalletVoucherSearchResults> SearchVouchers(WalletVoucherSearchFilter filter);

        Task<Wallet> CreateWallet(Guid userId);

        Task CreateWalletOrScheduleCreation(Guid? userId);

        List<WalletCreation> ListPendingCreationSchedule(int batchSize);

        Task UpdateScheduleCreation(WalletCreation item);
    }
}
