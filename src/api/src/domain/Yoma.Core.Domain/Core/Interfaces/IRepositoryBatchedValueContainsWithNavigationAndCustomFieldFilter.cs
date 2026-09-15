namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilter<T> :
    IRepositoryBatchedValueContainsWithNavigation<T>,
    IRepositoryCustomFieldFilter<T>
    where T : class
  {
  }
}
