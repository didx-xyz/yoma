using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Jobberman.Models;

namespace Yoma.Core.Infrastructure.Jobberman.Client
{
  public sealed class JobbermanClient : ISyncProviderClientPull<Opportunity>
  {
    #region Class Variables
    private readonly ILogger<JobbermanClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly JobbermanOptions _options;
    #endregion

    #region Constructor
    public JobbermanClient(ILogger<JobbermanClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      JobbermanOptions options)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _appSettings = appSettings ?? throw new ArgumentNullException(nameof(appSettings));
      _options = options ?? throw new ArgumentNullException(nameof(options));
    }
    #endregion

    #region Public Members
    public Task<SyncResultPull<Opportunity>> List(SyncFilterPull filter)
    {
      throw new NotImplementedException();

      //TODO: Read configured country feeds
      //TODO: Parse RSS items into the common sync model
      //TODO: Include stable external id and any source metadata needed for action resolution
    }
    #endregion
  }
}
