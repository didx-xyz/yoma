using Microsoft.EntityFrameworkCore;

namespace Yoma.Core.Infrastructure.Shared.Extensions
{
  public static class QueryableExtensions
  {
    /// <summary>
    /// Applies an EF hint to a SELECT query.
    /// The PostgreSQL interceptor translates this hint into the required TSQL.
    /// </summary>
    public static IQueryable<T> WithPessimisticLock<T>(
        this IQueryable<T> query,
        PessimisticLock lockMode)
    {
      ArgumentNullException.ThrowIfNull(query, nameof(query));

      if (!HintConfig.PessimisticLockHints.TryGetValue(lockMode, out var hint))
        throw new InvalidOperationException($"Unsupported pessimistic lock mode '{lockMode}'");

      return query.TagWith(hint);
    }
  }
}
