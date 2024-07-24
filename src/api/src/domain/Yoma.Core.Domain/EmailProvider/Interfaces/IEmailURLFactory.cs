namespace Yoma.Core.Domain.EmailProvider.Interfaces
{
  public interface IEmailURLFactory
  {
    string OrganizationApprovalItemURL(EmailType emailType, Guid organizationId);

    string OpportunityVerificationItemURL(EmailType emailType, Guid opportunityId, Guid? organizationId);

    string? OpportunityVerificationYoIDURL(EmailType emailType);

    string? OpportunityVerificationURL(EmailType emailType, Guid organizationId);

    string OpportunityExpirationItemURL(EmailType emailType, Guid opportunityId, Guid organizationId);

    string OpportunityAnnouncedItemURL(EmailType emailType, Guid opportunityId, Guid organizationId);

    string ActionLinkVerifyApprovalItemUrl(EmailType emailType, Guid? organizationId);
  }
}
