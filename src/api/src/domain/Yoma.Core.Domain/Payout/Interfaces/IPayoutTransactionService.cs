using Yoma.Core.Domain.Payout.Models;

namespace Yoma.Core.Domain.Payout.Interfaces
{
  public interface IPayoutTransactionService
  {
    PayoutTransaction GetById(Guid id);

    /// <summary>
    /// Returns the administrative payout view, including user identity and the linked reward funding transaction.
    /// </summary>
    PayoutTransactionInfo GetInfoById(Guid id);

    PayoutTransaction? GetActiveByUserIdOrNull(Guid userId);

    /// <summary>
    /// Returns the total amount of all pending payouts. Pending includes every non-terminal status and is not
    /// limited to the current financial year.
    /// </summary>
    decimal GetTotalPending();

    List<PayoutTransaction> ListByUserId(Guid userId);

    /// <summary>
    /// Searches Yoma's authoritative payout audit records for Treasury administration.
    /// </summary>
    PayoutTransactionSearchResults Search(PayoutTransactionSearchFilter filter);

    Task<PayoutTransaction> Create(Guid userId, PayoutType type, Payout.Provider provider, decimal amount, DateTimeOffset? rewardReservationExpiresAt = null);

    Task<PayoutTransaction> UpdateTransaction(PayoutTransaction item);
  }
}
