using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.EmailProvider.Services
{
  public class EmailPreferenceFilterService : IEmailPreferenceFilterService
  {
    #region Class Variables
    private readonly ILogger<EmailPreferenceFilterService> _logger;
    private readonly IUserService _userService;
    #endregion

    #region Constructor
    public EmailPreferenceFilterService(IUserService userService, ILogger<EmailPreferenceFilterService> logger)
    {
      _userService = userService;
      _logger = logger;
    }
    #endregion

    #region Public Members
    public List<EmailRecipient>? FilterRecipients(EmailType type, List<EmailRecipient>? recipients)
    {
      if (recipients == null || recipients.Count == 0) return recipients;

      var setting = type switch
      {
        // user
        EmailType.Opportunity_Verification_Rejected or EmailType.Opportunity_Verification_Completed or EmailType.Opportunity_Verification_Pending => Setting.User_Email_Opportunity_Completion,
        EmailType.Opportunity_Published => Setting.User_Email_Opportunity_Published,
        // organization admin
        EmailType.Organization_Approval_Approved or EmailType.Organization_Approval_Declined => Setting.Organization_Admin_Email_Organization_Approval,
        EmailType.Opportunity_Expiration_Expired or EmailType.Opportunity_Expiration_WithinNextDays => Setting.Organization_Admin_Email_Opportunity_Expiration,
        EmailType.Opportunity_Verification_Pending_Admin => Setting.Organization_Admin_Email_Opportunity_Completion,
        EmailType.ActionLink_Verify_Approval_Approved or EmailType.ActionLink_Verify_Approval_Declined => Setting.Organization_Admin_Email_ActionLink_Verify_Approval,
        // admin
        EmailType.Organization_Approval_Requested => Setting.Admin_Email_Organization_Approval,
        EmailType.Opportunity_Posted_Admin => Setting.Admin_Email_Opportunity_Posted,
        EmailType.ActionLink_Verify_Approval_Requested => Setting.Admin_Email_ActionLink_Verify_Approval,
        _ => throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported"),
      };
      var result = new List<EmailRecipient>();

      foreach (var recipient in recipients)
      {
        try
        {
          var settingsInfo = _userService.GetSettingsInfoByEmail(recipient.Email);
          var settingValue = SettingsHelper.GetValue<bool>(settingsInfo, setting.ToString());

          if (settingValue == true)
            result.Add(recipient);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to evaluate recipient email preference");
          result.Add(recipient);
        }
      }

      return result;
    }
    #endregion
  }
}
