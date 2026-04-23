using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.PartnerSync.Interfaces.Provider;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Client
{
  public sealed class AlisonClient : ISyncProviderClientPull<Opportunity>
  {
    #region Class Variables
    private readonly ILogger<AlisonClient> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AppSettings _appSettings;
    private readonly AlisonOptions _options;
    #endregion

    #region Constructor
    public AlisonClient(ILogger<AlisonClient> logger,
      IEnvironmentProvider environmentProvider,
      AppSettings appSettings,
      AlisonOptions options)
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

      //TODO: Implement access token acquisition
      //TODO: Implement authenticated course pull
      //TODO: Map Alison course payloads into the common sync model
      //TODO: Add refresh-token handling if token expiry needs runtime renewal
    }
    #endregion
  }
}
