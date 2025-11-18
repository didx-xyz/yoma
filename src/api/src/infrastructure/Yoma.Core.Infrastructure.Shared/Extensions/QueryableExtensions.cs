using Microsoft.EntityFrameworkCore;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Infrastructure.Shared.Extensions
{
  public static class QueryableExtensions
  {
    /// <summary>
    /// Applies an EF hint to a SELECT query.
    /// The PostgreSQL interceptor translates this hint into the required TSQL.
    /// </summary>
    public static IQueryable<T> WithLock<T>(
        this IQueryable<T> query,
        LockMode lockMode)
    {
      ArgumentNullException.ThrowIfNull(query, nameof(query));

      if (!HintConfig.LockHints.TryGetValue(lockMode, out var hint))
        throw new InvalidOperationException($"Unsupported lock mode '{lockMode}'");

      return query.TagWith(hint);
    }
  }
}
