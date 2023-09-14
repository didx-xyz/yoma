namespace Yoma.Core.Domain.EmailProvider
{
    public enum EmailType
    {
        Organization_Approval_Requested,
        Organization_Approval_Approved,
        Organization_Approval_Declined,
        Opportunity_Verification_Rejected,
        Opportunity_Verification_Completed,
        Opportunity_Expiration_Expired,
        Opportunity_Expiration_WithinNextDays
    }
}
