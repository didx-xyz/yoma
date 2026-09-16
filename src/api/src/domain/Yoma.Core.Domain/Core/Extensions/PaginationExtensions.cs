using System.Linq.Expressions;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Extensions
{
  public static class PaginationExtensions
  {
    #region Public Members
    // Call after validation and ordering, inside the existing PaginationEnabled branch.
    public static IQueryable<T> Page<T>(this IQueryable<T> query, PaginationFilter filter)
    {
      return query.Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value).Take(filter.PageSize.Value);
    }

    public static IEnumerable<T> Page<T>(this IEnumerable<T> query, PaginationFilter filter)
    {
      return query.Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value).Take(filter.PageSize.Value);
    }

    // hydrationQuery must retain the caller's non-text filters, especially ownership/visibility.
    // Passing an unrestricted query could disclose a row reassigned after page IDs were selected.
    public static (int? TotalCount, List<T> Items) ToPageWithChildren<T>(
      this IQueryable<T> query,
      PaginationFilter filter,
      Expression<Func<T, Guid>> idSelector,
      IQueryable<T> hydrationQuery,
      bool hydratePageSeparately = true)
    {
      if (!filter.PaginationEnabled) return (null, [.. query]);

      var totalCount = query.Count();
      // Non-browsing callers (e.g. organization-status event publication) can retain the original
      // filtered root/split reads. This avoids adding an ID-selection-to-hydration race where a
      // row changes filter-relevant fields. It does not make existing split reads snapshot-consistent.
      if (!hydratePageSeparately) return (totalCount, [.. query.Page(filter)]);

      // Select ordered IDs before split hydration so each child query avoids repeating the search.
      var ids = query.Page(filter).Select(idSelector).ToList();
      if (ids.Count == 0) return (totalCount, []);

      var contains = Expression.Call(
        typeof(Enumerable), nameof(Enumerable.Contains), [typeof(Guid)],
        Expression.Constant(ids), idSelector.Body);
      var predicate = Expression.Lambda<Func<T, bool>>(contains, idSelector.Parameters);
      var items = hydrationQuery.Where(predicate).ToDictionary(idSelector.Compile());

      // Restore page order. Concurrently deleted rows may disappear, as in other split reads.
      return (totalCount, [.. ids.Where(items.ContainsKey).Select(id => items[id])]);
    }
    #endregion
  }
}
