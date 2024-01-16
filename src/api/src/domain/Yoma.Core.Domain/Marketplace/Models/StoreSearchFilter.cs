using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
    public class StoreSearchFilter : PaginationFilter
    {
        public string? CategoryId { get; set; }
    }
}
