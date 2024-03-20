using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SendGrid;
using SendGrid.Helpers.Errors.Model;
using SendGrid.Helpers.Mail;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.EmailProvider;
using Yoma.Core.Domain.EmailProvider.Interfaces;
using Yoma.Core.Domain.EmailProvider.Models;
using Yoma.Core.Infrastructure.SendGrid.Models;

namespace Yoma.Core.Infrastructure.SendGrid.Client
{
  public class SendGridClient : IEmailProviderClient
  {
    #region Class Variables
    private readonly ILogger<SendGridClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly SendGridOptions _options;
    private readonly ISendGridClient _sendGridClient;
    #endregion

    #region Constructor
    public SendGridClient(ILogger<SendGridClient> logger,
        AppSettings appSettings,
        IEnvironmentProvider environmentProvider,
        SendGridOptions options,
        ISendGridClient sendGridClient)
    {
      _logger = logger;
      _appSettings = appSettings;
      _environmentProvider = environmentProvider;
      _options = options;
      _sendGridClient = sendGridClient;
    }
    #endregion

    #region Public Members
    public async Task Send<T>(EmailType type, List<EmailRecipient> recipients, T data)
        where T : EmailBase
    {
      if (!_appSettings.SendGridEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        _logger.LogInformation("Sending of email skipped for environment '{environment}'", _environmentProvider.Environment);
        return;
      }

      if (recipients == null || !recipients.Any())
        throw new ArgumentNullException(nameof(recipients));

      ArgumentNullException.ThrowIfNull(data);

      if (!_options.Templates.ContainsKey(type.ToString()))
        throw new ArgumentException($"Email template id for type '{type}' not configured", nameof(type));

      //ensure environment suffix
      data.SubjectSuffix = _environmentProvider.Environment == Domain.Core.Environment.Production ? string.Empty : $" ({_environmentProvider.Environment.ToDescription()})";

      var msg = new SendGridMessage
      {
        TemplateId = _options.Templates[type.ToString()],
        From = new EmailAddress(_options.From.Email, _options.From.Name),
        Personalizations = ProcessRecipients(recipients, data)
      };

      if (_options.ReplyTo != null) msg.ReplyTo = new EmailAddress(_options.ReplyTo.Email, _options.ReplyTo.Name);

      var response = await _sendGridClient.SendEmailAsync(msg);
      if (response.IsSuccessStatusCode) return;

      var responseBody = await response.Body.ReadAsStringAsync();
      var errorResponse = JsonConvert.DeserializeObject<SendGridErrorResponse>(responseBody)
          ?? throw new HttpClientException(response.StatusCode, "Failed to send email: Reason unknown");

      throw new HttpClientException(response.StatusCode, $"{errorResponse.ErrorReasonPhrase}: {errorResponse.SendGridErrorMessage}");
    }
    #endregion

    #region Private Members
    private List<Personalization> ProcessRecipients<T>(List<EmailRecipient> recipients, T data)
        where T : EmailBase
    {
      var result = new List<Personalization>();

      foreach (var recipient in recipients)
      {
        var dataCopy = ObjectHelper.DeepCopy(data);
        dataCopy.RecipientDisplayName = string.IsNullOrEmpty(recipient.DisplayName) ? recipient.Email : recipient.DisplayName;

        var item = new Personalization
        {
          Tos = [],
          TemplateData = dataCopy
        };

        item.Tos.Add(new EmailAddress(recipient.Email, recipient.DisplayName));
        result.Add(item);
      }

      return result;
    }
    #endregion
  }
}
