namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryWithNavigation<T> : IRepository<T>
        where T : class
  {
    IQueryable<T> Query(bool includeChildItems);
  }
}
