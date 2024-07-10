using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
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

      var settingKey = $"Email_{type}";
      var result = new List<EmailRecipient>();

      foreach (var recipient in recipients)
      {
        try
        {
          _logger.LogInformation("EmailType '{emailType}' | SettingKey '{settingKey}' | Email '{emailAddress}': Evaluating", type, settingKey, recipient.Email);

          var settingsInfo = _userService.GetSettingsInfoByEmail(recipient.Email);
          var settingValue = SettingsHelper.GetValue<bool>(settingsInfo, settingKey);

          if (settingValue == false)
          {
            _logger.LogInformation("EmailType '{emailType}' | SettingKey '{settingKey}' | Email '{emailAddress}': Not sent", type, settingKey, recipient.Email);
            continue;
          }

          result.Add(recipient);
          _logger.LogInformation("EmailType '{emailType}' | SettingKey '{settingKey}' | Email '{emailAddress}': Sent", type, settingKey, recipient.Email);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "EmailType '{emailType}' | SettingKey '{settingKey}' | Email '{emailAddress}': Error, sent anyway", type, settingKey, recipient.Email);
          result.Add(recipient);
        }
      }

      return result;
    }
    #endregion
  }
}
