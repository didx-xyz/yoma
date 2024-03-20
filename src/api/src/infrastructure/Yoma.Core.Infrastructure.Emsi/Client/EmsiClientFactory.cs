using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Infrastructure.Emsi.Models;

namespace Yoma.Core.Infrastructure.Emsi.Client
{
  public class EmsiClientFactory : ILaborMarketProviderClientFactory
  {
    #region Class Variables
    private readonly ILogger<EmsiClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly EmsiOptions _options;
    #endregion

    #region Constructor
    public EmsiClientFactory(ILogger<EmsiClient> logger,
        IEnvironmentProvider environmentProvider,
        IOptions<AppSettings> appSettings,
        IOptions<EmsiOptions> options)
    {
      _logger = logger;
      _environmentProvider = environmentProvider;
      _appSettings = appSettings.Value;
      _options = options.Value;
    }
    #endregion

    #region Public Members
    public ILaborMarketProviderClient CreateClient()
    {
      return new EmsiClient(_logger, _environmentProvider, _appSettings, _options);
    }
    #endregion
  }
}
