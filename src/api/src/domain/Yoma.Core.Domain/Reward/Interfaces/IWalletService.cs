using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Domain.Reward.Interfaces
{
    public interface IWalletService
    {
        string GetWalletId(Guid userId);

        string? GetWalletIdOrNull(Guid userId);

        WalletCreationStatus GetWalletCreationStatus(Guid userId);

        Task<WalletVoucherSearchResults> SearchVouchers(WalletVoucherSearchFilter filter);

        Task ScheduleCreation(Guid userId);

        List<WalletCreation> ListPendingCreationSchedule(int batchSize);

        Task UpdateScheduleCreation(WalletCreation item);
    }
}
