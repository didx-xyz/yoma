namespace Yoma.Core.Domain.Payout.Interfaces
{
  public interface IPayoutBackgroundService
  {
    Task ProcessReconciliation();
  }
}
