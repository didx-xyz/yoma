using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkSearchFilter : PaginationFilter
  {
    public Guid? ProgramId { get; set; }

    public string? ValueContains { get; set; }

    public List<ReferralLinkStatus>? Statuses { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }
  }

  public class ReferralLinkSearchFilterAdmin : ReferralLinkSearchFilter
  {
    public Guid? UserId { get; set; }
  }
}
