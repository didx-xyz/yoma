using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Text.RegularExpressions;
using Twilio.Clients;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Infrastructure.Twilio.Models;

/*
Sample appsettings.json payload:

"Twilio": {
  "AccountSid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "AuthToken": "your_auth_token_here",
  "From": {
    "WhatsApp": "+15557186878",
    "SMS": {
      "ZA": "+27600193536"
    }
  },
  "TemplatesWhatsApp": {
    "Organization_Approval_Requested": "template_id_1",
    "Opportunity_Published": "template_id_2"
  }
}
*/
namespace Yoma.Core.Infrastructure.Twilio.Client
{
  public partial class TwilioClient : IMessageProviderClient
  {
    #region Class Variables
    private readonly ILogger<TwilioClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly TwilioOptions _options;
    private readonly ITwilioRestClient _twilioClient;

    private static readonly MessageType[] PreferredMessageTypeOrder = [MessageType.WhatsApp, MessageType.SMS];
    #endregion

    #region Constructor
    public TwilioClient(ILogger<TwilioClient> logger,
        AppSettings appSettings,
        IEnvironmentProvider environmentProvider,
        TwilioOptions options,
        ITwilioRestClient twilioClient)
    {
      _logger = logger;
      _appSettings = appSettings;
      _environmentProvider = environmentProvider;
      _options = options;
      _twilioClient = twilioClient;
    }
    #endregion

    #region Public Members
    public async Task Send<T>(MessageType allowedMessageTypes, NotificationType notificationType, List<NotificationRecipient> recipients, T data)
     where T : NotificationBase
    {
      await Send(allowedMessageTypes, notificationType, [(recipients, data)]);
    }

    /// <summary>
    /// Sends a notification to one or more recipients using the allowed message types (e.g., WhatsApp and/or SMS),
    /// attempting fallback between types per recipient in the predefined order: WhatsApp → SMS.
    ///
    /// - Each recipient is processed in parallel on its own thread.
    /// - WhatsApp requires a configured template and 'From' number; if missing, an exception is thrown.
    /// - SMS is optional; if the template or 'From' number is missing or unsupported for the recipient's country, it will be skipped with an info log.
    /// - If all allowed message types fail for a recipient due to Twilio API errors or exceptions, the last failure reason is logged (not thrown).
    /// - Input validation errors (null/empty groups or missing configuration) throw immediately.
    /// </summary>
    public async Task Send<T>(MessageType allowedMessageTypes, NotificationType notificationType, List<(List<NotificationRecipient> Recipients, T Data)> recipientDataGroups)
        where T : NotificationBase
    {
      if ((allowedMessageTypes & MessageType.Email) != 0)
        throw new ArgumentException($"'{MessageType.Email}' is not a valid message type for Twilio", nameof(allowedMessageTypes));

      if ((allowedMessageTypes & (MessageType.WhatsApp | MessageType.SMS)) == 0)
        throw new ArgumentException($"At least one valid message type ('{MessageType.WhatsApp | MessageType.SMS}') must be specified", nameof(allowedMessageTypes));

      if (!_appSettings.TwilioEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        _logger.LogInformation("Sending of '{allowedMessageTypes}' skipped for environment '{environment}'", allowedMessageTypes, _environmentProvider.Environment);
        return;
      }

      if (recipientDataGroups == null || recipientDataGroups.Count == 0)
        throw new ArgumentNullException(nameof(recipientDataGroups), "Recipient data groups are null or empty");

      var notificationKey = notificationType.ToString();
      var sendTasks = new List<Task>();

      foreach (var (recipients, data) in recipientDataGroups)
      {
        if (recipients == null || recipients.Count == 0)
          throw new ArgumentNullException(nameof(recipientDataGroups), "Contains null or empty recipient list");

        if (data == null)
          throw new ArgumentNullException(nameof(recipientDataGroups), "Contains null data");

        //ensure environment suffix
        data.SubjectSuffix = _environmentProvider.Environment == Domain.Core.Environment.Production
            ? string.Empty
            : $" ({_environmentProvider.Environment.ToDescription()})";

        foreach (var recipient in recipients)
        {
          sendTasks.Add(Task.Run(async () =>
          {
            var recipientId = !string.IsNullOrWhiteSpace(recipient.PhoneNumber) ? recipient.PhoneNumber : recipient.Username;

            if (string.IsNullOrWhiteSpace(recipient.PhoneNumber))
            {
              _logger.LogInformation("{recipientId}: Skipped — Missing phone number", recipientId);
              return;
            }

            data.RecipientDisplayName = string.IsNullOrWhiteSpace(recipient.DisplayName)
                ? recipient.Username
                : recipient.DisplayName;

            var delivered = false;
            string? lastTwilioFailure = null;

            foreach (var messageType in PreferredMessageTypeOrder)
            {
              if (!allowedMessageTypes.HasFlag(messageType))
                continue;

              CreateMessageOptions messageOptions;
              string? fromNumber;

              try
              {
                switch (messageType)
                {
                  case MessageType.SMS:
                    var smsTemplate = SMSTemplates.ResourceManager.GetString(notificationKey);
                    if (string.IsNullOrWhiteSpace(smsTemplate))
                    {
                      _logger.LogInformation("{recipientId}: Skipped — SMS template for '{notificationKey}' not configured", recipientId, notificationKey);
                      continue;
                    }

                    var alpha2 = PhoneNumberExtensions.ToPhoneNumberCountryCodeAlpha2(recipient.PhoneNumber);
                    if (string.IsNullOrEmpty(alpha2) ||
                        _options.From?.SMS == null ||
                        !_options.From.SMS.TryGetValue(alpha2.ToUpperInvariant(), out fromNumber) ||
                        string.IsNullOrWhiteSpace(fromNumber))
                    {
                      _logger.LogInformation("{recipientId}: Skipped — SMS 'From' number not configured for country {country}", recipientId, alpha2 ?? "Unknown");
                      continue;
                    }

                    messageOptions = new CreateMessageOptions(new PhoneNumber(recipient.PhoneNumber))
                    {
                      From = new PhoneNumber(fromNumber),
                      Body = ParseSMSBody(smsTemplate, data.ContentVariables(messageType))
                    };
                    break;

                  case MessageType.WhatsApp:
                    if (_options.TemplatesWhatsApp == null ||
                        !_options.TemplatesWhatsApp.TryGetValue(notificationKey, out var templateId))
                      throw new InvalidOperationException($"WhatsApp template for '{notificationKey}' not configured");

                    fromNumber = _options.From?.WhatsApp;
                    if (string.IsNullOrWhiteSpace(fromNumber))
                      throw new InvalidOperationException("WhatsApp 'From' number is not configured");

                    messageOptions = new CreateMessageOptions(new PhoneNumber($"whatsapp:{recipient.PhoneNumber}"))
                    {
                      From = new PhoneNumber($"whatsapp:{fromNumber}"),
                      ContentSid = templateId,
                      ContentVariables = JsonConvert.SerializeObject(data.ContentVariables(messageType))
                    };
                    break;

                  default:
                    throw new InvalidOperationException($"Unsupported message type: {messageType}");
                }

                var response = await MessageResource.CreateAsync(messageOptions, _twilioClient);

                if (response.ErrorCode.HasValue)
                {
                  lastTwilioFailure = $"{recipientId}: Twilio API error — {response.ErrorMessage ?? "Unknown error"} ({response.ErrorCode.Value})";
                  break;
                }

                switch (messageType)
                {
                  case MessageType.SMS:
                    delivered = true;
                    break;

                  case MessageType.WhatsApp:
                    if (_options.DeliveryPollingWhatsAppTimeoutInSeconds <= 0)
                      throw new InvalidOperationException("WhatsApp delivery polling timeout is not configured");

                    var timeout = TimeSpan.FromSeconds(_options.DeliveryPollingWhatsAppTimeoutInSeconds);
                    var startTime = DateTimeOffset.UtcNow;

                    while (true)
                    {
                      MessageResource message;
                      try
                      {
                        message = await MessageResource.FetchAsync(new FetchMessageOptions(response.Sid), _twilioClient);

                        if (message.Status == MessageResource.StatusEnum.Delivered)
                        {
                          delivered = true;
                          break;
                        }
                      }
                      catch (Exception ex)
                      {
                        lastTwilioFailure = $"{recipientId}: Polling error — {ex.Message}";
                        break;
                      }

                      if (DateTimeOffset.UtcNow - startTime >= timeout) break;
                      await Task.Delay(500);
                    }

                    if (!delivered && string.IsNullOrEmpty(lastTwilioFailure))
                      lastTwilioFailure = $"{recipientId}: Polling timed out — message not confirmed as delivered";

                    break;

                  default:
                    throw new InvalidOperationException($"Unsupported message type: {messageType}");
                }
              }
              catch (Exception ex)
              {
                lastTwilioFailure = $"{recipientId}: Notification send failed — {ex.Message}";
              }
            }

            if (!delivered && !string.IsNullOrEmpty(lastTwilioFailure))
            {
              _logger.LogError("Notification failed for recipient {recipient}: {reason}", recipientId, lastTwilioFailure);
            }
          }));
        }
      }

      await Task.WhenAll(sendTasks).FlattenAggregateException();
    }

    #endregion

    #region Private Members
    private static string ParseSMSBody(string template, Dictionary<string, string> contentVariables)
    {
      return ContentVariableRegex().Replace(template, match =>
      {
        var key = match.Groups[1].Value;
        return contentVariables.TryGetValue(key, out var value) ? value : match.Value;
      });
    }

    [GeneratedRegex(@"\{(\d+)\}")]
    private static partial Regex ContentVariableRegex();
    #endregion
  }
}
