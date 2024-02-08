using Aries.CloudAPI.DotnetSDK.AspCore.Clients;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Infrastructure.AriesCloud.Interfaces;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClientFactory : ISSIProviderClientFactory
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ClientFactory _clientFactory;
        private readonly ISSEListenerService _sseListenerService;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
        private readonly IRepository<Models.Connection> _connectionRepository;
        #endregion

        #region Constructor
        public AriesCloudClientFactory(IOptions<AppSettings> appSettings,
            ClientFactory clientFactory,
            ISSEListenerService sseListenerService,
            IRepository<Models.CredentialSchema> credentialSchemaRepository,
            IRepository<Models.Connection> connectionRepository)
        {
            _appSettings = appSettings.Value;
            _clientFactory = clientFactory;
            _sseListenerService = sseListenerService;
            _credentialSchemaRepository = credentialSchemaRepository;
            _connectionRepository = connectionRepository;
        }
        #endregion

        #region Public Members
        public ISSIProviderClient CreateClient()
        {
            return new AriesCloudClient(_appSettings, _clientFactory, _sseListenerService, _credentialSchemaRepository, _connectionRepository);
        }
        #endregion
    }
}
