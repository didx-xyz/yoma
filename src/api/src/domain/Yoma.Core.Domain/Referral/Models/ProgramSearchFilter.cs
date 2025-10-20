using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramSearchFilterBase : PaginationFilter
  {
    public string? ValueContains { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }
  }

  public class ProgramSearchFilter : ProgramSearchFilterBase
  {
    public bool? IncludeExpired { get; set; }
  }

  public class ProgramSearchFilterAdmin : ProgramSearchFilterBase
  {
    public List<ProgramStatus>? Statuses { get; set; }
  }
}
