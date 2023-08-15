using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Lookups.Models
{
  public class SkillSearchFilter : PaginationFilter
  {
    public string? NameContains { get; set; }
  }
}
