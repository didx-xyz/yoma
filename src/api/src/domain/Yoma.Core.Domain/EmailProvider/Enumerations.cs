namespace Yoma.Core.Domain.EmailProvider
{
  public enum EmailType
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
    Opportunity_Verification_Pending_Admin //sent to organization admin
  }
}
