namespace Yoma.Core.Domain.ActionLink
{
  public enum ActionLinkStatus
  {
    Active, // flagged as expired if end date reached
    Inactive, // flagged as deleted if inactive for x days
    Expired, // remains expired (not auto-deleted)
    LimitReached, // remains limitReached (not auto-deleted)
    Deleted
  }

  public enum ActionLinkUsageStatus
  {
    All,
    Claimed,
    Unclaimed
  }

  public enum ActionLinkEntityType
  {
    Opportunity
  }

  public enum LinkAction
  {
    Share,
    Verify
  }
}
