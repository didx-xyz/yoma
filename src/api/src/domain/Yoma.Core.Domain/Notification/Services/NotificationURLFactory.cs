using Flurl;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification.Interfaces;

namespace Yoma.Core.Domain.Notification.Services
{
  public class NotificationURLFactory : INotificationURLFactory
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    #endregion

    #region Constructor
    public NotificationURLFactory(IOptions<AppSettings> appSettings)
    {
      _appSettings = appSettings.Value;
    }
    #endregion

    #region Public Members
    public string ActionLinkVerifyApprovalItemUrl(NotificationType emailType, Guid? organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      var result = _appSettings.AppBaseURL;
      LinkStatus? status;
      switch (emailType)
      {
        case NotificationType.ActionLink_Verify_Approval_Requested:
          result = result.AppendPathSegment("admin").AppendPathSegment("links").ToString();
          status = LinkStatus.Inactive;
          break;

        case NotificationType.ActionLink_Verify_Approval_Approved:
        case NotificationType.ActionLink_Verify_Approval_Declined:
          if (!organizationId.HasValue)
            throw new InvalidOperationException("Organization id expected");

          result = result.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("links").ToString();

          status = emailType == NotificationType.ActionLink_Verify_Approval_Approved ? LinkStatus.Active : LinkStatus.Declined;
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported");
      }

      result = result.AppendQueryParam($"statuses={status.Value.ToString().ToLower()}").ToString();
      return result;
    }

    public string OrganizationApprovalItemURL(NotificationType emailType, Guid organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      var result = _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).ToString();
      result = emailType switch
      {
        NotificationType.Organization_Approval_Requested => result.AppendPathSegment("verify").ToString(),
        NotificationType.Organization_Approval_Approved => result.AppendPathSegment("opportunities").ToString(),
        NotificationType.Organization_Approval_Declined => result.AppendPathSegment("edit").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
      return result;
    }

    public string OpportunityVerificationItemURL(NotificationType emailType, Guid opportunityId, Guid? organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      var result = _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(opportunityId).ToString();
      switch (emailType)
      {
        case NotificationType.Opportunity_Verification_Rejected:
        case NotificationType.Opportunity_Verification_Completed:
        case NotificationType.Opportunity_Verification_Pending:
          break;
        case NotificationType.Opportunity_Verification_Pending_Admin:
          if (!organizationId.HasValue || organizationId.Value == Guid.Empty)
            throw new ArgumentNullException(nameof(organizationId));

          result = _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId)
                  .AppendPathSegment("opportunities").AppendPathSegment(opportunityId).AppendPathSegment("info").ToString();
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported");
      }

      return result;
    }

    public string? OpportunityVerificationYoIDURL(NotificationType emailType)
    {
      var result = _appSettings.AppBaseURL.AppendPathSegment("yoid/opportunities").ToString();
      switch (emailType)
      {
        case NotificationType.Opportunity_Verification_Rejected:
          result = result.AppendPathSegment("rejected").ToString();
          break;

        case NotificationType.Opportunity_Verification_Completed:
        case NotificationType.ActionLink_Verify_Distribution:
          result = result.AppendPathSegment("completed").ToString();
          break;

        case NotificationType.Opportunity_Verification_Pending:
          result = result.AppendPathSegment("pending").ToString();
          break;

        case NotificationType.Opportunity_Verification_Pending_Admin:
          return null;

        default:
          throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported");
      }

      return result;
    }

    public string? OpportunityVerificationURL(NotificationType emailType, Guid organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return emailType switch
      {
        NotificationType.Opportunity_Verification_Rejected or NotificationType.Opportunity_Verification_Completed or NotificationType.Opportunity_Verification_Pending => null,
        NotificationType.Opportunity_Verification_Pending_Admin => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("verifications").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
    }

    public string OpportunityExpirationItemURL(NotificationType emailType, Guid opportunityId, Guid organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return emailType switch
      {
        NotificationType.Opportunity_Expiration_Expired or NotificationType.Opportunity_Expiration_WithinNextDays
        => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("opportunities")
        .AppendPathSegment(opportunityId).AppendPathSegment("info").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
    }

    public string OpportunityPublishedItemURL(NotificationType emailType, Guid opportunityId, Guid organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return emailType switch
      {
        NotificationType.Opportunity_Published => _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(opportunityId).ToString(),
        NotificationType.Opportunity_Posted_Admin => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId)
                                        .AppendPathSegment("opportunities").AppendPathSegment(opportunityId).AppendPathSegment("info")
                                        .SetQueryParam("returnUrl", "/admin/opportunities").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
    }
    #endregion
  }
}
