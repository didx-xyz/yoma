using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Infrastructure.Shared.Extensions
{
  public static class RepositorySearchExtensions
  {
    #region Public Members
    public static IQueryable<T> WhereContains<T>(
      this IRepositoryValueContains<T> repository, IQueryable<T> query, string value)
      where T : class
    {
      // Keep matching semantics in one predicate overload; preserve filters already on the query.
      return query.Where(repository.Contains(PredicateBuilder.False<T>(), value));
    }
    #endregion
  }
}
