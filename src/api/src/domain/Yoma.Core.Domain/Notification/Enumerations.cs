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
    Download //sent to admin or organization admin
  }

  [Flags]
  public enum MessageType
  {
    Email = 1,
    SMS = 2,
    WhatsApp = 4
  }
}
