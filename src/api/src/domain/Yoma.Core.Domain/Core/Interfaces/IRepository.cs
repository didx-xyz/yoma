namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepository<T> where T : class
  {
    IQueryable<T> Query();

    Task<T> Create(T item);

    Task<T> Update(T item);

    Task Delete(T item);
  }
}
