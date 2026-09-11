using Aries.CloudAPI.DotnetSDK.AspCore.Clients;
using Microsoft.Extensions.Logging;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
  public class AriesCloudClientFactory : ISSIProviderClientFactory
  {
    #region Class Variables
    private readonly ILogger<AriesCloudClient> _logger;
    private readonly ClientFactory _clientFactory;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly ISSEListenerService _sseListenerService;
    private readonly IRepository<Models.Credential> _credentialRepository;
    private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
    private readonly IRepository<Models.Connection> _connectionRepository;
    #endregion

    #region Constructor
    public AriesCloudClientFactory(ILogger<AriesCloudClient> logger,
        ClientFactory clientFactory,
        IEnvironmentProvider environmentProvider,
        ISSEListenerService sseListenerService,
        IRepository<Models.Credential> credentialRepository,
        IRepository<Models.CredentialSchema> credentialSchemaRepository,
        IRepository<Models.Connection> connectionRepository)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _clientFactory = clientFactory;
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _sseListenerService = sseListenerService;
      _credentialRepository = credentialRepository;
      _credentialSchemaRepository = credentialSchemaRepository;
      _connectionRepository = connectionRepository;
    }
    #endregion

    #region Public Members
    public ISSIProviderClient CreateClient()
    {
      return new AriesCloudClient(_logger, _clientFactory, _environmentProvider, _sseListenerService,
        _credentialRepository, _credentialSchemaRepository, _connectionRepository);
    }
    #endregion
  }
}
