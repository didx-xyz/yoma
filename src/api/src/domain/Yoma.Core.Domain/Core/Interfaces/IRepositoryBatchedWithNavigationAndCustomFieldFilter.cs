namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryBatchedWithNavigationAndCustomFieldFilter<T> :
    IRepositoryBatchedWithNavigation<T>,
    IRepositoryCustomFieldFilter<T>
    where T : class
  {
  }
}
