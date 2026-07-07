namespace Yoma.Core.Domain.PartnerSync
{
  public enum EntityType
  {
    Opportunity,
    MyOpportunity
  }

  public enum SyncAction
  {
    Create,
    Update,
    Delete
  }

  public enum ProcessingStatus
  {
    Pending,
    Processed,
    Error,
    Aborted
  }

  public enum TrackingStatus
  {
    Successful,
    Partial,
    Failed
  }

  public enum SyncItemVerificationStatus
  {
    InProgress,
    Completed,
    Cancelled
  }
}
