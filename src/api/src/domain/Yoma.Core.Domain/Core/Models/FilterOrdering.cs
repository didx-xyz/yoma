using System.Linq.Expressions;

namespace Yoma.Core.Domain.Core.Models
{
    public class FilterOrdering<TEntity>
    {
        public Expression<Func<TEntity, object>> OrderBy { get; set; }

        public FilterSortOrder SortOrder { get; set; } = FilterSortOrder.Ascending;
    }
}
