namespace Yoma.Core.Domain.Notification.Interfaces
{
  public interface INotificationURLFactory
  {
    string OrganizationApprovalItemURL(NotificationType notificationType, Guid organizationId);

    string OpportunityVerificationItemURL(NotificationType notificationType, Guid opportunityId, Guid? organizationId);

    string? OpportunityVerificationYoIDURL(NotificationType notificationType);

    string? OpportunityVerificationURL(NotificationType notificationType, Guid organizationId);

    string OpportunitiesPublicURL(NotificationType notificationType, List<Guid>? countryIds);

    string OpportunityExpirationItemURL(NotificationType notificationType, Guid opportunityId, Guid organizationId);

    string OpportunityPublishedItemURL(NotificationType notificationType, Guid opportunityId, Guid organizationId);

    string ActionLinkVerifyActivatedItemUrl(NotificationType notificationType, Guid organizationId, Guid linkId);
  }
}
