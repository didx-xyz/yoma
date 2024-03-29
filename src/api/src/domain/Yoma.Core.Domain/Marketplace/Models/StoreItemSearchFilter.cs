using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreItemSearchFilter : PaginationFilter
  {
    public string StoreId { get; set; }

    public string ItemCategoryId { get; set; }
  }
}
