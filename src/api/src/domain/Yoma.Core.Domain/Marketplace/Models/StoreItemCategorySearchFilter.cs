using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
    public class StoreItemCategorySearchFilter : PaginationFilter
    {
        public string StoreId { get; set; }
    }
}
