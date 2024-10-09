using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;

namespace Yoma.Core.Domain.Notification.Services
{
  public class NotificationPreferenceFilterService : INotificationPreferenceFilterService
  {
    #region Class Variables
    private readonly ILogger<NotificationPreferenceFilterService> _logger;
    private readonly IUserService _userService;
    #endregion

    #region Constructor
    public NotificationPreferenceFilterService(IUserService userService, ILogger<NotificationPreferenceFilterService> logger)
    {
      _userService = userService;
      _logger = logger;
    }
    #endregion

    #region Public Members
    public List<NotificationRecipient>? FilterRecipients(NotificationType type, List<NotificationRecipient>? recipients)
    {
      if (recipients == null || recipients.Count == 0) return recipients;

      // recipient filtering not applicable to the types below
      switch (type)
      {
        case NotificationType.ActionLink_Verify_Distribution:
          return recipients; 
      }

      var setting = type switch
      {
        // user
        NotificationType.Opportunity_Verification_Rejected or NotificationType.Opportunity_Verification_Completed or NotificationType.Opportunity_Verification_Pending => Setting.User_Notification_Opportunity_Completion,
        NotificationType.Opportunity_Published => Setting.User_Notification_Opportunity_Published,
        // organization admin
        NotificationType.Organization_Approval_Approved or NotificationType.Organization_Approval_Declined => Setting.Organization_Admin_Notification_Organization_Approval,
        NotificationType.Opportunity_Expiration_Expired or NotificationType.Opportunity_Expiration_WithinNextDays => Setting.Organization_Admin_Notification_Opportunity_Expiration,
        NotificationType.Opportunity_Verification_Pending_Admin => Setting.Organization_Admin_Notification_Opportunity_Completion,
        NotificationType.ActionLink_Verify_Approval_Approved or NotificationType.ActionLink_Verify_Approval_Declined => Setting.Organization_Admin_Notification_ActionLink_Verify_Approval,
        // admin
        NotificationType.Organization_Approval_Requested => Setting.Admin_Notification_Organization_Approval,
        NotificationType.Opportunity_Posted_Admin => Setting.Admin_Notification_Opportunity_Posted,
        NotificationType.ActionLink_Verify_Approval_Requested => Setting.Admin_Notification_ActionLink_Verify_Approval, 
        _ => throw new ArgumentOutOfRangeException(nameof(type), $"Type of '{type}' not supported"),
      };
      var result = new List<NotificationRecipient>();

      foreach (var recipient in recipients)
      {
        try
        {
          var settingsInfo = _userService.GetSettingsInfoByUsername(recipient.Username);
          var settingValue = SettingsHelper.GetValue<bool>(settingsInfo, setting.ToString());

          if (settingValue == true)
            result.Add(recipient);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to evaluate recipient username preference");
          result.Add(recipient);
        }
      }

      return result;
    }
    #endregion
  }
}
