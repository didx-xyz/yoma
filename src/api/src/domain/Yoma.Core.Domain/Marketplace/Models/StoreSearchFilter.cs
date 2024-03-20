using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Marketplace.Models
{
  public class StoreSearchFilter : PaginationFilter
  {
    public string CountryCodeAlpha2 { get; set; }

    public string? CategoryId { get; set; }
  }
}
