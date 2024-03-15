namespace Yoma.Core.Domain.EmailProvider.Interfaces
{
    public interface IEmailURLFactory
    {
        string OrganizationApprovalItemURL(EmailType emailType, Guid organizationId);

        string OpportunityVerificationItemURL(EmailType emailType, Guid opportunityId, Guid? organizationId);

        string? OpportunityVerificationYoIDURL(EmailType emailType);

        string? OpportunityVerificationURL(EmailType emailType, Guid organizationId);

        string OpportunityExpirationItemURL(EmailType emailType, Guid opportunityId, Guid organizationId);

        string OpportunityPostedItemURL(EmailType emailType, Guid opportunityId, Guid organizationId);
    }
}
