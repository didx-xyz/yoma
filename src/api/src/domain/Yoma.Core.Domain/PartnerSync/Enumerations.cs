namespace Yoma.Core.Domain.PartnerSync
{
  public enum EntityType
  {
    Opportunity
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

  public enum Partner
  {
    SAYouth,
    Jobberman,
    Alison
  }

  public enum SyncType
  {
    Push,
    Pull
  }
}
