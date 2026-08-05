using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Payout.Interfaces
{
  public interface IPayoutTransactionService
  {
    PayoutTransaction GetById(Guid id);

    PayoutTransaction? GetActiveByUserIdOrNull(Guid userId);

    /// <summary>
    /// Returns the total amount of all pending payouts. Pending includes every non-terminal status and is not
    /// limited to the current financial year.
    /// </summary>
    decimal GetTotalPending();

    List<PayoutTransaction> ListByUserId(Guid userId);

    Task<PayoutTransaction> Create(Guid userId, PayoutType type, Payout.Provider provider, decimal amount, DateTimeOffset? rewardReservationExpiresAt = null);

    Task<PayoutTransaction> UpdateTransaction(PayoutTransaction item);
  }
}
