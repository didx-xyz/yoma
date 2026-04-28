using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Infrastructure.Jobberman.Models;

namespace Yoma.Core.Infrastructure.Jobberman.Client
{
  public sealed class JobbermanClientFactory : ISyncProviderClientFactory<ISyncProviderClientPull<Domain.Opportunity.Models.Opportunity>>
  {
    #region Class Variables
    private readonly ILogger<JobbermanClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly JobbermanOptions _options;
    #endregion

    #region Constructor
    public JobbermanClientFactory(ILogger<JobbermanClient> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<AppSettings> appSettings,
      IOptions<JobbermanOptions> options)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
    }
    #endregion

    #region Public Members
    public ISyncProviderClientPull<Domain.Opportunity.Models.Opportunity> CreateClient()
    {
      return new JobbermanClient(_logger, _environmentProvider, _appSettings, _options);
    }
    #endregion
  }
}
