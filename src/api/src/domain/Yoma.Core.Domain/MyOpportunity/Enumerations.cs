namespace Yoma.Core.Domain.MyOpportunity
{
  public enum Action
  {
    Viewed,
    Saved,
    Verification,
    NavigatedExternalLink
  }

  public enum VerificationStatus
  {
    None,
    Pending, //flagged as rejected if pending and not modified for x days
    Rejected,
    Completed
  }
}
