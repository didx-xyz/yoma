using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Models.Provider;

namespace Yoma.Core.Domain.Reward.Interfaces.Provider
{
  public interface IRewardProviderClient
  {
    Task<CreateWalletResponse> CreateWallet(CreateWalletRequest request);

    Task UpdateWalletUsername(UpdateWalletUsernameRequest request);

    Task<Wallet> GetWallet(string walletId);

    Task<ReservePayoutResponse> ReserveForPayout(ReservePayoutRequest request);

    Task CommitPayoutReservation(CommitPayoutReservationRequest request);

    Task ReleasePayoutReservation(ReleasePayoutReservationRequest request);

    Task<List<WalletVoucher>> ListWalletVouchers(string walletId, int? limit, int? offset);

    Task<string> RewardEarn(RewardAwardRequest request);
  }
}
