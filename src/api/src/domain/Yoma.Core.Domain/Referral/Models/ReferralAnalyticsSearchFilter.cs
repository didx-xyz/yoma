using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralAnalyticsSearchFilterAdmin : ReferralAnalyticsSearchFilter
  {
    public Guid? ProgramId { get; set; }

    public DateTimeOffset? StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    [JsonIgnore]
    internal Guid? UserId { get; set; }

    /// <summary>
    /// Indicates whether the query should be processed with fewer restrictions, bypassing pagination validation, ordering, 
    /// and computed fields.
    /// When set to <c>true</c>, pagination validation is skipped, ordering is not applied unless explicitly required, 
    /// and additional costly computations are avoided.
    /// However, if <c>PaginationEnabled</c> is <c>true</c>, pagination will still be applied, but unnecessary processing 
    /// will be minimized.
    /// </summary>
    [JsonIgnore]
    internal bool UnrestrictedQuery { get; set; } = false;
  }

  public class ReferralAnalyticsSearchFilter : PaginationFilter
  {
    public ReferralParticipationRole Role { get; set; }
  }
}
