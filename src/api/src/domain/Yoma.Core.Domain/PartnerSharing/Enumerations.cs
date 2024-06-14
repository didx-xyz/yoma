namespace Yoma.Core.Domain.PartnerSharing
{
  public enum EntityType
  {
    Opportunity
  }

  public enum ProcessingAction
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
    Aborted //TODO: Seed
  }

  public enum Partner
  {
    SAYouth
  }
}
