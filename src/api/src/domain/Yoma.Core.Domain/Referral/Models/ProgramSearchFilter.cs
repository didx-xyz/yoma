using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramSearchFilterBase : PaginationFilter
  {
    public string? ValueContains { get; set; }
  }

  public class ProgramSearchFilter : ProgramSearchFilterBase
  {
  }

  public class ProgramSearchFilterAdmin : ProgramSearchFilterBase
  {
    public List<ProgramStatus>? Statuses { get; set; }
  }
}
