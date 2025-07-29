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
    Active, // flagged as expired if end date reached
    Inactive, // flagged as deleted if inactive for x days
    Expired, // remains expired (not auto-deleted)
    LimitReached, // remains limitReached (not auto-deleted)
    Deleted
  }
}
