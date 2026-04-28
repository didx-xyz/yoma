using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Jobberman.Models;

namespace Yoma.Core.Infrastructure.Jobberman.Client
{
  public sealed class JobbermanClient : ISyncProviderClientPull<Domain.Opportunity.Models.Opportunity>
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
    public Task<SyncResultPull<Domain.Opportunity.Models.Opportunity>> List(SyncFilterPull filter)
    {
      if (!_appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
      {
        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Partner synchronization from external partners disabled for environment '{environment}'. Using local .NET embedded resources", _environmentProvider.Environment);

        //TODO: Synchronize from local .NET embedded resources instead of external partner systems.
        //The mock payload files should be added to the solution, marked as Embedded Resource,
        //and compiled into the assembly so local/dev sync can run without calling partner APIs.
        //This is typically used for local and dev with small embedded JSON/XML payloads.
        //Stage should synchronize from the external partner test/stage environment if available,
        //otherwise from the partner production environment.
      }

      throw new NotImplementedException();

      //TODO: Read configured country feeds
      //TODO: Parse RSS items into the common sync model
      //TODO: Include stable external id and any source metadata needed for action resolution
    }
    #endregion
  }
}
