namespace Yoma.Core.Domain.Marketplace.Interfaces.Lookups
{
  public interface ITransactionStatusService
  {
    Models.Lookups.TransactionStatus GetByName(string name);

    Models.Lookups.TransactionStatus? GetByNameOrNull(string name);

    Models.Lookups.TransactionStatus GetById(Guid id);

    Models.Lookups.TransactionStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.TransactionStatus> List();
  }
}
