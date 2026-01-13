using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Referral.Models
{
  public abstract class ProgramSearchFilterBase : PaginationFilter
  {
    public List<Guid>? Countries { get; set; }

    public string? ValueContains { get; set; }

    /// <summary>
    /// Optionally filters programs by their published state. By default, results include programs that are active and have started (thus published state Active).
    /// This default behavior can be overridden
    /// </summary>
    [JsonIgnore]
    internal List<PublishedState>? PublishedStates { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }
  }

  public class ProgramSearchFilter : ProgramSearchFilterBase
  {
    public new List<PublishedState>? PublishedStates { get; set; }
  }

  public class ProgramSearchFilterAdmin : ProgramSearchFilterBase
  {
    public List<ProgramStatus>? Statuses { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }
  }
}
