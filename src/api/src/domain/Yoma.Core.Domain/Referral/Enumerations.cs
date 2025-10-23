namespace Yoma.Core.Domain.Referral
{
  public enum ProgramStatus
  {
    Active,      // Default state when created; automatically transitions to Expired once the end date is reached
    Inactive,    // Manually deactivated by a super admin; automatically transitions to Deleted after remaining inactive for a defined period
    Expired,     // Automatically flagged when the end date is reached; transitions to Deleted after a defined retention period
    Deleted      // Terminal state; may result from manual deletion or automated cleanup by the system
  }

  public enum PathwayCompletionRule
  {
    All,
    Any
  }

  public enum PathwayOrderMode
  {
    Sequential,
    AnyOrder
  }


  public enum PathwayTaskEntityType
  {
    Opportunity = 1
  }

  [Flags]
  public enum ProofOfPersonhoodMethod
  {
    None,
    OTP,
    SocialLogin
  }

  public enum ReferralLinkStatus //suffixed to avoid swagger conflicts with ActionLink domain
  {
    Active,        // Default state when created by the referrer
    Cancelled,     // Cancelled by the referrer or super-admin, implicitly by a super admin when blocking a referrer, or automatically due to program deletion; cannot be reactivated
    LimitReached,  // Set when the program’s referral limit is reached; cannot be reactivated
    Expired        // Automatically flagged when the parent program expires; cannot be reactivated
  }

  public enum ReferralLinkUsageStatus //suffixed to avoid swagger conflicts with ActionLink domain
  {
    Pending,     // Default state when the referral link is claimed by a referee
    Completed,   // All required tasks have been completed; terminal state
    Expired      // The parent program expires or link completion elapsed; terminal state
  }

  public enum ReferralBlockReason
  {
    Other
  }
}
