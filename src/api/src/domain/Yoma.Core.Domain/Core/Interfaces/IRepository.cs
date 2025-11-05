namespace Yoma.Core.Domain.Core.Interfaces
{
  // TODO: Add row-locking support (FOR UPDATE SKIP LOCKED) via interceptor when Query(RowLockMode.SkipLocked) is used.
  public interface IRepository<T> where T : class
  {
    IQueryable<T> Query();

    Task<T> Create(T item);

    Task<T> Update(T item);

    Task Delete(T item);
  }
}
