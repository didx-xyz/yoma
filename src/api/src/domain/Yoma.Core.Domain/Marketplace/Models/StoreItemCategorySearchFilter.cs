using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreItemCategorySearchFilter : PaginationFilter
  {
    public string StoreId { get; set; }

    [JsonIgnore]
    internal bool EvaluateStoreAccessControlRules { get; set; } = true;
  }
}
