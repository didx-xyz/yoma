using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Twilio.Clients;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Infrastructure.Twilio.Models;

namespace Yoma.Core.Infrastructure.Twilio.Client
{
  public class TwilioClientFactory : IMessageProviderClientFactory
  {
    #region Class Variables
    private readonly ILogger<TwilioClient> _logger;
    private readonly AppSettings _appSettings;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly TwilioOptions _options;
    private readonly ITwilioRestClient _twilioClient;
    #endregion

    #region Constructor
    public TwilioClientFactory(ILogger<TwilioClient> logger,
        IOptions<AppSettings> appSettings,
        IEnvironmentProvider environmentProvider,
        IOptions<TwilioOptions> options,
        ITwilioRestClient twilioClient)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _environmentProvider = environmentProvider;
      _options = options.Value;
      _twilioClient = twilioClient;
    }
    #endregion

    #region Public Members
    public IMessageProviderClient CreateClient()
    {
      return new TwilioClient(_logger, _appSettings, _environmentProvider, _options, _twilioClient);
    }
    #endregion
  }
}
