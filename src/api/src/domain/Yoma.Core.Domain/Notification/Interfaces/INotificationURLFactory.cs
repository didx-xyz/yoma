namespace Yoma.Core.Domain.Notification.Interfaces
{
  public interface INotificationURLFactory
  {
    string OrganizationApprovalItemURL(NotificationType emailType, Guid organizationId);

    string OpportunityVerificationItemURL(NotificationType emailType, Guid opportunityId, Guid? organizationId);

    string? OpportunityVerificationYoIDURL(NotificationType emailType);

    string? OpportunityVerificationURL(NotificationType emailType, Guid organizationId);

    string OpportunityExpirationItemURL(NotificationType emailType, Guid opportunityId, Guid organizationId);

    string OpportunityAnnouncedItemURL(NotificationType emailType, Guid opportunityId, Guid organizationId);

    string ActionLinkVerifyApprovalItemUrl(NotificationType emailType, Guid? organizationId);
  }
}
