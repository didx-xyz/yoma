using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Payout.Models;
using Yoma.Core.Domain.Payout.Models.Provider;

namespace Yoma.Core.Domain.Payout.Interfaces
{
  public interface IPayoutService
  {
    Task<List<Country>?> ListCountries();

    Task<PayoutCountryAvailability> IsCountrySupported(Guid? countryId);

    Task<PayoutTransaction> Payout(Guid userId, decimal amount);

    Task<PayoutSession> PayoutRewards(Guid userId, decimal amount);

    Task<PayoutSession> GetSession(Guid userId);

    Task ProcessStatus(PayoutStatusResponse response);

    List<PayoutTransaction> ListForReconciliation(int batchSize, List<Guid> idsToSkip);

    Task Reconcile(Guid id);
  }
}
