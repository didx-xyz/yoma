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
    Inactive, //flagged as declined if inactive for x days
    Expired,
    LimitReached,
    Declined, //flagged as deleted if declined for x days
    Deleted
  }
}
