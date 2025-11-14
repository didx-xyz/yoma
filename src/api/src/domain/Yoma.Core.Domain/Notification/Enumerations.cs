namespace Yoma.Core.Domain.Notification
{
  public enum NotificationType
  {
    Organization_Approval_Requested, //sent to admin
    Organization_Approval_Approved, //sent to organization admin
    Organization_Approval_Declined, //sent to organization admin
    Opportunity_Verification_Rejected, //sent to youth
    Opportunity_Verification_Completed, //sent to youth
    Opportunity_Expiration_Expired, //sent to organization admin
    Opportunity_Expiration_WithinNextDays, //sent to organization admin
    Opportunity_Posted_Admin, //sent to admin
    Opportunity_Verification_Pending, //sent to youth
    Opportunity_Verification_Pending_Admin, //sent to organization admin
    ActionLink_Verify_Distribution, //sent to youth mailing / distribution list
    ActionLink_Verify_Activated, //sent to organization admin
    Opportunity_Published, //sent to youth
    Download, //sent to admin or organization admin

    // sent to admin
    ReferralProgram_Expiration_Expired,          // program reached End Date (if specified) OR remained UnCompletable beyond the 15-day grace period (configurable) → program expired
    ReferralProgram_Expiration_WithinNextDays,   // program approaching End Date — sent once per day during the final 3 days (configurable) before expiration
    ReferralProgram_UnCompletable,               // pathway became Un-Completable — send immediately, then every 5 days (configurable), and daily for the last 3 days (configurable) before the 15-day grace (configurable) period elapses

    // sent to referrer (youth)
    ReferralLink_Completed_ReferrerAwarded,      // a referee completed and the referrer received reward > 0 Zlto
    Referral_Blocked_Referrer,                   // referrer was blocked from using the referral system
    Referral_Unblocked_Referrer,                 // referrer was unblocked and can use the referral system again

    // sent to referee (youth)
    ReferralUsage_Welcome,                       // referee claimed a referral link (welcome message + instructions)
    ReferralUsage_Completion                     // referee completed the referral program associated with the claimed link (includes note of any reward earned)

    // TODO: RUM Settings (https://linear.app/did-x/issue/YOMA-984/implement-user-consent-for-datadog-rum-monitoring)
  }

  [Flags]
  public enum MessageType
  {
    Email = 1,
    SMS = 2,
    WhatsApp = 4
  }
}
