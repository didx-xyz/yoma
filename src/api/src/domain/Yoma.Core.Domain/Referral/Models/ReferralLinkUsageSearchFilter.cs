using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Referral.Models
{
  public class ReferralLinkUsageSearchFilter : PaginationFilter
  {
    public Guid? LinkId { get; set; }

    public Guid? ProgramId { get; set; }

    public List<ReferralLinkUsageStatus>? Statuses { get; set; }

    public DateTimeOffset? DateStart { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    [JsonIgnore]
    internal bool TotalCountOnly { get; set; }
  }

  public class ReferralLinkUsageSearchFilterAdmin : ReferralLinkUsageSearchFilter
  {
    public Guid? UserIdReferee { get; set; }

    public Guid? UserIdReferrer { get; set; }
  }
}
