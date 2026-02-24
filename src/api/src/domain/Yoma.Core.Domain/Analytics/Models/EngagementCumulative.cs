using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Analytics.Models
{
  public class EngagementCumulative
  {
    public TimeIntervalSummary Completions { get; set; } = null!;
  }
}
