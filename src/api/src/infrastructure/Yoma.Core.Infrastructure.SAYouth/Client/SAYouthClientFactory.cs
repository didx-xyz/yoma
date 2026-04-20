using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth.Client
{
  public class SAYouthClientFactory : ISyncProviderClientFactory<ISyncProviderClientPush<Opportunity>>
  {
    #region Class Variables
    private readonly ILogger<SAYouthClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly SAYouthOptions _options;
    #endregion

    #region Constructor
    public SAYouthClientFactory(ILogger<SAYouthClient> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<AppSettings> appSettings,
      IOptions<SAYouthOptions> options)
    {
      _logger = logger;
      _environmentProvider = environmentProvider;
      _appSettings = appSettings.Value;
      _options = options.Value;
    }
    #endregion

    #region Public Members
    public ISyncProviderClientPush<Opportunity> CreateClient()
    {
      return new SAYouthClient(_logger, _environmentProvider, _appSettings, _options);
    }
    #endregion
  }
}
