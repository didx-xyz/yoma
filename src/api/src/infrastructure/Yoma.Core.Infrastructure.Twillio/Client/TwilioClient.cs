using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Text.RegularExpressions;
using Twilio.Clients;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Infrastructure.Twilio.Models;

namespace Yoma.Core.Infrastructure.Twilio.Client
{
  public partial class TwilioClient : IMessageProviderClient
  {
    #region Class Variables
    private readonly ILogger<TwilioClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly TwilioOpptions _options;
    private readonly ITwilioRestClient _twilioClient;
    #endregion

    #region Constructor
    public TwilioClient(ILogger<TwilioClient> logger,
        AppSettings appSettings,
        IEnvironmentProvider environmentProvider,
        TwilioOpptions options,
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
    public async Task Send<T>(MessageType deliveryType, NotificationType notificationType, List<NotificationRecipient> recipients, T data)
     where T : NotificationBase
    {
      await Send(deliveryType, notificationType, [(recipients, data)]);
    }

    public async Task Send<T>(MessageType deliveryType, NotificationType notificationType, List<(List<NotificationRecipient> Recipients, T Data)> recipientDataGroups)
     where T : NotificationBase
    {
      if (!_appSettings.TwilioEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        _logger.LogInformation("Sending of {deliveryType} skipped for environment '{environment}'", deliveryType, _environmentProvider.Environment);
        return;
      }

      if (recipientDataGroups == null || recipientDataGroups.Count == 0)
        throw new ArgumentNullException(nameof(recipientDataGroups));

      // Messages will only be sent if the 'From' number is configured based on the delivery type:
      // - For SMS: The 'From' number must be configured for SMS in _options.From
      // - For WhatsApp: The 'From' number must be configured for WhatsApp in _options.From
      if (_options.From == null || !_options.From.ContainsKey(deliveryType.ToString()))
      {
        _logger.LogInformation("Sending of {deliveryType} skipped: 'From' number not configured", deliveryType);
        return;
      }

      // Messages will only be sent if:
      // - For SMS, the template exists in the resources file (SMSTemplates)
      // - For WhatsApp, the template ID is configured in _options.Templates
      var smsTemplate = string.Empty;
      switch (deliveryType)
      {
        case MessageType.SMS:
          smsTemplate = SMSTemplates.ResourceManager.GetString(notificationType.ToString());
          if (string.IsNullOrWhiteSpace(smsTemplate))
          {
            _logger.LogInformation("Sending of {deliveryType} skipped: Template for notification type '{notificationType}' not configured", deliveryType, notificationType);
            return;
          }
          break;

        case MessageType.WhatsApp:
          if (_options.Templates == null || !_options.Templates.ContainsKey(notificationType.ToString()))
          {
            _logger.LogWarning("Sending of {deliveryType} skipped: Template for notification type '{notificationType}' not configured", deliveryType, notificationType);
            return;
          }
          break;

        default:
          throw new InvalidOperationException($"Unsupported delivery type: {deliveryType}");
      }

      var failedRecipients = new List<string>();
      foreach (var (recipients, data) in recipientDataGroups)
      {
        if (recipients == null || recipients.Count == 0)
          throw new ArgumentNullException(nameof(recipientDataGroups), "Contains null or empty recipient list");

        if (data == null)
          throw new ArgumentNullException(nameof(recipientDataGroups), "Contains null data");

        //ensure environment suffix
        data.SubjectSuffix = _environmentProvider.Environment == Domain.Core.Environment.Production
            ? string.Empty
            : $"{_environmentProvider.Environment.ToDescription()} - ";

        foreach (var recipient in recipients)
        {
          data.RecipientDisplayName = string.IsNullOrEmpty(recipient.DisplayName) ? recipient.Username : recipient.DisplayName;

          var messageOptions = deliveryType switch
          {
            MessageType.SMS => new CreateMessageOptions(new PhoneNumber(recipient.PhoneNumber))
            {
              From = new PhoneNumber(_options.From[deliveryType.ToString()]),
              Body = ParseSMSBody(smsTemplate, data.ContentVariables)
            },

            MessageType.WhatsApp => new CreateMessageOptions(new PhoneNumber($"whatsapp:{recipient.PhoneNumber}"))
            {
              From = new PhoneNumber(_options.From[deliveryType.ToString()]),
              ContentSid = _options.Templates![notificationType.ToString()],
              ContentVariables = JsonConvert.SerializeObject(data.ContentVariables)
            },

            _ => throw new InvalidOperationException($"Unsupported delivery type: {deliveryType}")
          };

          var response = await MessageResource.CreateAsync(messageOptions, _twilioClient);
          if (!response.ErrorCode.HasValue) continue;

          var message = string.IsNullOrEmpty(response.ErrorMessage) ? "Unknown error" : response.ErrorMessage;
          var detail = $"{recipient.PhoneNumber}: {message} ({response.ErrorCode.Value})";
          failedRecipients.Add(detail);
        }
      }

      if (failedRecipients.Count == 0) return;
      var consolidatedErrorMessage = $"Failed to send {deliveryType}:{Environment.NewLine}{string.Join(Environment.NewLine, failedRecipients)}";
      throw new HttpClientException(System.Net.HttpStatusCode.InternalServerError, consolidatedErrorMessage);
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
