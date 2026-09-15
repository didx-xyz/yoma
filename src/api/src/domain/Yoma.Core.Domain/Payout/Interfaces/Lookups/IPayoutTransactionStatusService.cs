namespace Yoma.Core.Domain.Payout.Interfaces.Lookups
{
  public interface IPayoutTransactionStatusService
  {
    Models.Lookups.PayoutTransactionStatus GetByName(string name);

    Models.Lookups.PayoutTransactionStatus? GetByNameOrNull(string name);

    Models.Lookups.PayoutTransactionStatus GetById(Guid id);

    Models.Lookups.PayoutTransactionStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.PayoutTransactionStatus> List();
  }
}
