using Newtonsoft.Json;

namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkRequestCreateShare : LinkRequestCreateBase
  {
    [JsonIgnore]
    internal override LinkAction Action => LinkAction.Share;
  }
}
