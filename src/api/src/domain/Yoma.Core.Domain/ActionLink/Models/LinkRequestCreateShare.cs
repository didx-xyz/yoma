namespace Yoma.Core.Domain.ActionLink.Models
{
  public class LinkRequestCreateShare : LinkRequestCreateBase
  {
    internal override LinkAction Action => LinkAction.Share;
  }
}
