using Flurl;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Notification.Interfaces;

namespace Yoma.Core.Domain.Notification.Services
{
  public class NotificationURLFactory : INotificationURLFactory
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly ICountryService _countryService;
    #endregion

    #region Constructor
    public NotificationURLFactory(IOptions<AppSettings> appSettings,
      ICountryService countryService)
    {
      _appSettings = appSettings.Value;
      _countryService = countryService;
    }
    #endregion

    #region Public Members
    public string ActionLinkVerifyApprovalItemUrl(NotificationType notificationType, Guid? organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      var result = _appSettings.AppBaseURL;
      LinkStatus? status;
      switch (notificationType)
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

          status = notificationType == NotificationType.ActionLink_Verify_Approval_Approved ? LinkStatus.Active : LinkStatus.Declined;
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported");
      }

      result = result.SetQueryParam("statuses", status.Value.ToString().ToLower());
      return result;
    }

    public string OrganizationApprovalItemURL(NotificationType notificationType, Guid organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      var result = _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).ToString();
      result = notificationType switch
      {
        NotificationType.Organization_Approval_Requested => result.AppendPathSegment("verify").ToString(),
        NotificationType.Organization_Approval_Approved => result.AppendPathSegment("opportunities").ToString(),
        NotificationType.Organization_Approval_Declined => result.AppendPathSegment("edit").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported"),
      };
      return result;
    }

    public string OpportunityVerificationItemURL(NotificationType notificationType, Guid opportunityId, Guid? organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      var result = _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(opportunityId).ToString();
      switch (notificationType)
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
          throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported");
      }

      return result;
    }

    public string? OpportunityVerificationYoIDURL(NotificationType notificationType)
    {
      var result = _appSettings.AppBaseURL.AppendPathSegment("yoid/opportunities").ToString();
      switch (notificationType)
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
          throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported");
      }

      return result;
    }

    public string OpportunitiesPublicURL(NotificationType notificationType, List<Guid>? countryIds)
    {
      countryIds = countryIds?.Where(id => id != Guid.Empty).Distinct().ToList();

      var result = _appSettings.AppBaseURL.AppendPathSegment("opportunities");

      switch (notificationType)
      {
        case NotificationType.Opportunity_Published:
          if (countryIds == null || countryIds.Count == 0) break;
          result = result.SetQueryParam("countries", string.Join('|', countryIds.Select(o => _countryService.GetById(o).Name)));
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported");
      }

      return result.ToString();
    }

    public string? OpportunityVerificationURL(NotificationType notificationType, Guid organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return notificationType switch
      {
        NotificationType.Opportunity_Verification_Rejected or NotificationType.Opportunity_Verification_Completed or NotificationType.Opportunity_Verification_Pending => null,
        NotificationType.Opportunity_Verification_Pending_Admin => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("verifications").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported"),
      };
    }

    public string OpportunityExpirationItemURL(NotificationType notificationType, Guid opportunityId, Guid organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return notificationType switch
      {
        NotificationType.Opportunity_Expiration_Expired or NotificationType.Opportunity_Expiration_WithinNextDays
        => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("opportunities")
        .AppendPathSegment(opportunityId).AppendPathSegment("info").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported"),
      };
    }

    public string OpportunityPublishedItemURL(NotificationType notificationType, Guid opportunityId, Guid organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return notificationType switch
      {
        NotificationType.Opportunity_Published => _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(opportunityId).ToString(),
        NotificationType.Opportunity_Posted_Admin => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId)
                                        .AppendPathSegment("opportunities").AppendPathSegment(opportunityId).AppendPathSegment("info")
                                        .SetQueryParam("returnUrl", "/admin/opportunities").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(notificationType), $"Type of '{notificationType}' not supported"),
      };
    }
    #endregion
  }
}
