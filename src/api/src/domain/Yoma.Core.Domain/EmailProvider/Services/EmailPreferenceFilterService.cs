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

    private const string SettingsKey_Email_Prefix = "Email";
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

      var settingKey = $"{SettingsKey_Email_Prefix}_{type}";
      var result = new List<EmailRecipient>();

      foreach (var recipient in recipients)
      {
        try
        {
          var settingsInfo = _userService.GetSettingsInfoByEmail(recipient.Email);
          var settingValue = SettingsHelper.GetValue<bool>(settingsInfo, settingKey);

          if (settingValue == false) continue;

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
