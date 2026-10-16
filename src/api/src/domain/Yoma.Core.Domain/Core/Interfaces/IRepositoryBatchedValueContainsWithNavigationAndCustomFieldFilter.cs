namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryBatchedValueContainsWithNavigationAndCustomFieldFilter<T> :
    IRepositoryBatchedValueContainsWithNavigation<T>,
    IRepositoryCustomFieldFilter<T>,
    IRepositoryPropertyContains<T>
    where T : class
  {
  }
}
