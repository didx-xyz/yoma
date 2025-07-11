using Aries.CloudAPI.DotnetSDK.AspCore.Clients;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
  public class AriesCloudClientFactory : ISSIProviderClientFactory
  {
    #region Class Variables
    private readonly ClientFactory _clientFactory;
    private readonly ISSEListenerService _sseListenerService;
    private readonly IRepository<Models.Credential> _credentialRepository;
    private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
    private readonly IRepository<Models.Connection> _connectionRepository;
    #endregion

    #region Constructor
    public AriesCloudClientFactory(ClientFactory clientFactory,
        ISSEListenerService sseListenerService,
        IRepository<Models.Credential> credentialRepository,
        IRepository<Models.CredentialSchema> credentialSchemaRepository,
        IRepository<Models.Connection> connectionRepository)
    {
      _clientFactory = clientFactory;
      _sseListenerService = sseListenerService;
      _credentialRepository = credentialRepository;
      _credentialSchemaRepository = credentialSchemaRepository;
      _connectionRepository = connectionRepository;
    }
    #endregion

    #region Public Members
    public ISSIProviderClient CreateClient()
    {
      return new AriesCloudClient(_clientFactory, _sseListenerService, _credentialRepository, _credentialSchemaRepository, _connectionRepository);
    }
    #endregion
  }
}
