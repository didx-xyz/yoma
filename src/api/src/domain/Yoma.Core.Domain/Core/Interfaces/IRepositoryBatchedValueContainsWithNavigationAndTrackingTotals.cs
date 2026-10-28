namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryBatchedValueContainsWithNavigationAndTrackingTotals<T> :
    IRepositoryBatchedValueContainsWithNavigation<T>,
    IRepositoryBatchedTrackingTotals<T>
    where T : class
  {
  }
}
