using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SendGrid;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Infrastructure.SendGrid.Models;

namespace Yoma.Core.Infrastructure.SendGrid.Client
{
  public class SendGridClientFactory : IEmailProviderClientFactory
  {
    #region Class Variables
    private readonly ILogger<SendGridClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly SendGridOptions _options;
    private readonly ISendGridClient _sendGridClient;
    #endregion

    #region Constructor
    public SendGridClientFactory(ILogger<SendGridClient> logger,
        IOptions<AppSettings> appSettings,
        IEnvironmentProvider environmentProvider,
        IOptions<SendGridOptions> options,
        ISendGridClient sendGridClient)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _environmentProvider = environmentProvider;
      _options = options.Value;
      _sendGridClient = sendGridClient;
    }
    #endregion

    #region Public Members
    public IEmailProviderClient CreateClient()
    {
      return new SendGridClient(_logger, _appSettings, _environmentProvider, _options, _sendGridClient);
    }
    #endregion
  }
}
