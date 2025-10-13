namespace Yoma.Core.Domain.Referral
{
  public enum ProgramStatus
  {
    Active, // flagged as expired if end date reached
    Inactive, // flagged as deleted if inactive for x days
    Expired, //flagged as deleted if expired and not modified for x days
    Deleted
  }

  public enum PathwayStepRule
  {
    All,
    Any
  }

  public enum PathwayTaskEntityType
  {
    Opportunity = 1
  }
}
