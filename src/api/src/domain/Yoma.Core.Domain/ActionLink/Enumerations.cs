namespace Yoma.Core.Domain.ActionLink
{
  public enum LinkEntityType
  {
    Opportunity
  }

  public enum LinkAction
  {
    Share,
    Verify
  }

  public enum LinkStatus
  {
    Active,
    Inactive,
    Expired,
    LimitReached
  }
}
