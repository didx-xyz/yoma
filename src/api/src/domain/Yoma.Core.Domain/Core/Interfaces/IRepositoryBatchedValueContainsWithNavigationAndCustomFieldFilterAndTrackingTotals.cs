namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilterAndTrackingTotals<T> :
    IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilter<T>,
    IRepositoryBatchedTrackingTotals<T>
    where T : class
  {
  }
}
