using Newtonsoft.Json;

namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkRequestCreateVerify : LinkRequestCreateBase
  {
    public int? UsagesLimit { get; set; }

    public DateTimeOffset? DateEnd { get; set; }

    public List<string?>? DistributionList { get; set; }

    public bool? LockToDistributionList { get; set; }

    [JsonIgnore]
    internal override LinkAction Action => LinkAction.Verify;
  }
}
