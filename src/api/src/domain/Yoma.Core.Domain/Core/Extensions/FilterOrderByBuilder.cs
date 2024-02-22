using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Extensions
{
    public static class FilterOrderByBuilder
    {
        public static IQueryable<TEntity> ApplyFiltersAndOrdering<TEntity>(
                this IQueryable<TEntity> query, List<FilterOrdering<TEntity>> ordering)
        {
            var isFirstOrdering = true;
            foreach (var instruction in ordering)
            {
                if (isFirstOrdering)
                {
                    query = instruction.SortOrder == FilterSortOrder.Ascending
                        ? query.OrderBy(instruction.OrderBy)
                        : query.OrderByDescending(instruction.OrderBy);
                    isFirstOrdering = false;
                }
                else
                {
                    // Cast query to IOrderedQueryable<TEntity> for ThenBy and ThenByDescending
                    var orderedQuery = (IOrderedQueryable<TEntity>)query;
                    query = instruction.SortOrder == FilterSortOrder.Ascending
                        ? orderedQuery.ThenBy(instruction.OrderBy)
                        : orderedQuery.ThenByDescending(instruction.OrderBy);
                }
            }

            return query;
        }
    }
}
