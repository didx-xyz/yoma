using System.Linq.Expressions;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryValueContains<T> : IRepository<T>
        where T : class
  {
    Expression<Func<T, bool>> Contains(Expression<Func<T, bool>> predicate, string value);

    IQueryable<T> Contains(IQueryable<T> query, string value);
  }
}
