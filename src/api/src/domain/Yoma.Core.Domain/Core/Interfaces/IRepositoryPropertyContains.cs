using System.Linq.Expressions;

namespace Yoma.Core.Domain.Core.Interfaces
{
  public interface IRepositoryPropertyContains<T> : IRepository<T> where T : class
  {
    /// <summary>
    /// Build a database-translatable, case-insensitive contains predicate for the selected property.
    /// Callers compose field combinations and any explicit inclusion of unspecified values.
    /// </summary>
    Expression<Func<T, bool>> Contains(Expression<Func<T, string?>> property, string value);

    /// <summary>
    /// Apply the property predicate while preserving the supplied query's existing restrictions.
    /// </summary>
    IQueryable<T> Contains(IQueryable<T> query, Expression<Func<T, string?>> property, string value);
  }
}
