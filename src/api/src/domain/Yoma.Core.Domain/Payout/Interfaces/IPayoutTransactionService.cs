using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Payout.Interfaces
{
  public interface IPayoutTransactionService
  {
    PayoutTransaction GetById(Guid id);

    PayoutTransaction? GetActiveByUserIdOrNull(Guid userId);

    decimal GetAmountActive();

    List<PayoutTransaction> ListByUserId(Guid userId);

    Task<PayoutTransaction> Create(Guid userId, PayoutType type, Payout.Provider provider, decimal amount, DateTimeOffset? rewardReservationExpiresAt = null);

    Task<PayoutTransaction> UpdateTransaction(PayoutTransaction item);
  }
}
