using Flurl;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider.Interfaces;

namespace Yoma.Core.Domain.EmailProvider.Services
{
  public class EmailURLFactory : IEmailURLFactory
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    #endregion

    #region Constructor
    public EmailURLFactory(IOptions<AppSettings> appSettings)
    {
      _appSettings = appSettings.Value;
    }
    #endregion

    #region Public Members
    public string ActionLinkVerifyApprovalItemUrl(EmailType emailType, Guid? organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      var result = _appSettings.AppBaseURL;
      switch (emailType)
      {
        case EmailType.ActionLink_Verify_Approval_Requested:
          result = result.AppendPathSegment("admin").AppendPathSegment("links").ToString();
          break;

        case EmailType.ActionLink_Verify_Approval_Approved:
        case EmailType.ActionLink_Verify_Approval_Declined:
          if (!organizationId.HasValue)
            throw new InvalidOperationException("Organization id expected");

          result = result.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("links").ToString();
          break;

        default:
          throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported");
      }

      return result;
    }

    public string OrganizationApprovalItemURL(EmailType emailType, Guid organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      var result = _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).ToString();
      result = emailType switch
      {
        EmailType.Organization_Approval_Requested => result.AppendPathSegment("verify").ToString(),
        EmailType.Organization_Approval_Approved => result.AppendPathSegment("opportunities").ToString(),
        EmailType.Organization_Approval_Declined => result.AppendPathSegment("edit").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
      return result;
    }

    public string OpportunityVerificationItemURL(EmailType emailType, Guid opportunityId, Guid? organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      var result = _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(opportunityId).ToString();
      switch (emailType)
      {
        case EmailType.Opportunity_Verification_Rejected:
        case EmailType.Opportunity_Verification_Completed:
        case EmailType.Opportunity_Verification_Pending:
          break;
        case EmailType.Opportunity_Verification_Pending_Admin:
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

    public string? OpportunityVerificationYoIDURL(EmailType emailType)
    {
      var result = _appSettings.AppBaseURL.AppendPathSegment("yoid/opportunities").ToString();
      switch (emailType)
      {
        case EmailType.Opportunity_Verification_Rejected:
          result = result.AppendPathSegment("declined").ToString();
          break;

        case EmailType.Opportunity_Verification_Completed:
        case EmailType.ActionLink_Verify_Distribution:
          result = result.AppendPathSegment("completed").ToString();
          break;

        case EmailType.Opportunity_Verification_Pending:
          result = result.AppendPathSegment("submitted").ToString();
          break;

        case EmailType.Opportunity_Verification_Pending_Admin:
          return null;

        default:
          throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported");
      }

      return result;
    }

    public string? OpportunityVerificationURL(EmailType emailType, Guid organizationId)
    {
      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return emailType switch
      {
        EmailType.Opportunity_Verification_Rejected or EmailType.Opportunity_Verification_Completed or EmailType.Opportunity_Verification_Pending => null,
        EmailType.Opportunity_Verification_Pending_Admin => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("verifications").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
    }

    public string OpportunityExpirationItemURL(EmailType emailType, Guid opportunityId, Guid organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return emailType switch
      {
        EmailType.Opportunity_Expiration_Expired or EmailType.Opportunity_Expiration_WithinNextDays
        => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId).AppendPathSegment("opportunities")
        .AppendPathSegment(opportunityId).AppendPathSegment("info").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
    }

    public string OpportunityAnnouncedItemURL(EmailType emailType, Guid opportunityId, Guid organizationId)
    {
      if (opportunityId == Guid.Empty)
        throw new ArgumentNullException(nameof(opportunityId));

      if (organizationId == Guid.Empty)
        throw new ArgumentNullException(nameof(organizationId));

      return emailType switch
      {
        EmailType.Opportunity_Published => _appSettings.AppBaseURL.AppendPathSegment("opportunities").AppendPathSegment(opportunityId).ToString(),
        EmailType.Opportunity_Posted_Admin => _appSettings.AppBaseURL.AppendPathSegment("organisations").AppendPathSegment(organizationId)
                                        .AppendPathSegment("opportunities").AppendPathSegment(opportunityId).AppendPathSegment("info")
                                        .SetQueryParam("returnUrl", "/admin/opportunities").ToString(),
        _ => throw new ArgumentOutOfRangeException(nameof(emailType), $"Type of '{emailType}' not supported"),
      };
    }
    #endregion
  }
}
