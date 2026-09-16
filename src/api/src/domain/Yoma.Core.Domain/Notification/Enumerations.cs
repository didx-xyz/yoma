namespace Yoma.Core.Domain.Notification
{
  /*
  Referral Notifications – Channel Support Notes
  -------------------------------------------------------------
  Email is fully supported for all referral notifications.

  WhatsApp and SMS are currently disabled due to cost constraints.
  Templates for these channels are defined below for future use.

  -------------------------------------------------------------
  NotificationType.ReferralLink_Completed_ReferrerAwarded
  A referee completed and the referrer received reward > 0 Zlto

  WhatsApp:
  Hi there{{1}}
  Great news — your referral was completed and you’ve earned a ZLTO reward!
  Button: View Dashboard

  SMS:
  Yoma{{1}} - Your referral link was completed. View: {{2}}

  -------------------------------------------------------------
  NotificationType.Referral_Blocked_Referrer
  Referrer was blocked from using the referral system

  WhatsApp:
  Hi there{{1}}
  Your referral access on Yoma has been blocked.
  Button: View Dashboard

  SMS:
  Yoma{{1}} - Your referral access has been blocked. Need help? {{2}}

  -------------------------------------------------------------
  NotificationType.Referral_Unblocked_Referrer
  Referrer was unblocked and can use the referral system again

  WhatsApp:
  Hi there{{1}}
  Your referral access on Yoma has been unblocked.
  Button: View Dashboard

  SMS:
  Yoma{{1}} - Your referral access has been unblocked. View: {{2}}

  -------------------------------------------------------------
  NotificationType.ReferralUsage_Welcome
  Referee claimed a referral link (welcome + instructions)

  WhatsApp:
  Hi there{{1}}
  You’ve joined a referral program on Yoma. Welcome aboard!
  Button: View Dashboard

  SMS:
  Yoma{{1}} - You’ve joined a referral program on Yoma. View: {{2}}

  -------------------------------------------------------------
  NotificationType.ReferralUsage_Completion
  Referee completed the referral program linked to the claimed referral

  WhatsApp:
  Hi there{{1}}
  You’ve completed your referral program on Yoma. Well done!
  Button: View Dashboard

  SMS:
  Yoma{{1}} - You’ve completed your referral program on Yoma. View: {{2}}
  -------------------------------------------------------------
  */

  /*
  Youth Payout Notifications - Future Short Message Templates
  -------------------------------------------------------------
  These drafts define ContentVariables if phone delivery is introduced.
  Channel routing remains owned by NotificationDeliveryService.
  {{1}} = environment suffix (empty in Production).
  {{2}} = wallet link: full URL in SMS; path/query in the WhatsApp button.
  WhatsApp buttons use an environment-specific Yoma base URL followed by /{{2}}.
  SMS has no button: the wallet URL appears as plain text in the message.
  Keep amounts, currency and technical references out of these short messages.
  Review provider approval and rendered SMS length before enabling delivery;
  URL/suffix length can vary, so do not assume a fixed segment count.

  -------------------------------------------------------------
  NotificationType.Payout_Youth_Completed

  WhatsApp:
  Hi there{{1}}
  Your cash-out is complete. Your ZLTO has been deducted from your wallet.
  Button: View My Wallet - URL: <Yoma base URL>/{{2}}

  SMS:
  Yoma{{1}} - Cash-out complete. Your ZLTO was deducted. Wallet: {{2}}

  -------------------------------------------------------------
  NotificationType.Payout_Youth_Cancelled

  WhatsApp:
  Hi there{{1}}
  Your cash-out was cancelled. Your ZLTO is available in your wallet again.
  Button: View My Wallet - URL: <Yoma base URL>/{{2}}

  SMS:
  Yoma{{1}} - Cash-out cancelled. Your ZLTO is available again. Wallet: {{2}}

  -------------------------------------------------------------
  NotificationType.Payout_Youth_Expired

  WhatsApp:
  Hi there{{1}}
  The time to confirm your cash-out ran out. Your ZLTO is available in your
  wallet again. You can start a new cash-out when you are ready.
  Button: View My Wallet - URL: <Yoma base URL>/{{2}}

  SMS:
  Yoma{{1}} - Cash-out expired. Your ZLTO is available again. Wallet: {{2}}

  -------------------------------------------------------------
  NotificationType.Payout_Youth_Failed

  WhatsApp:
  Hi there{{1}}
  Your cash-out did not go through. Your ZLTO is available in your wallet
  again. Please try again later.
  Button: View My Wallet - URL: <Yoma base URL>/{{2}}

  SMS:
  Yoma{{1}} - Cash-out failed. Your ZLTO is available again. Wallet: {{2}}
  -------------------------------------------------------------
  */

  public enum NotificationType
  {
    // Organization approval — recipients indicated per outcome
    Organization_Approval_Requested, // admin
    Organization_Approval_Approved, // organization admin
    Organization_Approval_Declined, // organization admin

    // Opportunities and action links — recipients indicated per event
    Opportunity_Verification_Rejected, // youth
    Opportunity_Verification_Completed, // youth
    Opportunity_Expiration_Expired, // organization admin
    Opportunity_Expiration_WithinNextDays, // organization admin
    Opportunity_Posted_Admin, // admin
    Opportunity_Verification_Pending, // youth
    Opportunity_Verification_Pending_Admin, // organization admin
    ActionLink_Verify_Distribution, // youth mailing / distribution list
    ActionLink_Verify_Activated, // organization admin
    Opportunity_Published, // youth

    // Downloads — admin or organization admin
    Download,

    // Referral program health — admin
    ReferralProgram_Expiration_Expired,          // program reached End Date (if specified) OR remained UnCompletable beyond the 15-day grace period (configurable) → program expired
    ReferralProgram_Expiration_WithinNextDays,   // program approaching End Date — sent once per day during the final 3 days (configurable) before expiration
    ReferralProgram_UnCompletable,               // pathway became Un-Completable — send immediately, then sent once per day during the final 5 days (configurable) before expiration

    // Referral rewards and access — referrer (youth)
    ReferralLink_Completed_ReferrerAwarded,      // a referee completed and the referrer received reward > 0 Zlto
    Referral_Blocked_Referrer,                   // referrer was blocked from using the referral system
    Referral_Unblocked_Referrer,                 // referrer was unblocked and can use the referral system again

    // Referral participation — referee (youth)
    ReferralUsage_Welcome,                       // referee claimed a referral link (welcome message + instructions)
    ReferralUsage_Completion,                    // referee completed the referral program associated with the claimed link (includes note of any reward earned)

    // Payout outcomes — youth
    Payout_Youth_Completed,
    Payout_Youth_Cancelled,
    Payout_Youth_Expired,
    Payout_Youth_Failed
  }

  [Flags]
  public enum MessageType
  {
    Email = 1,
    SMS = 2,
    WhatsApp = 4
  }
}
