using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Entity.Models
{
  public class UserSearchFilter : PaginationFilter
  {
    public string? ValueContains { get; set; }
  }
}
