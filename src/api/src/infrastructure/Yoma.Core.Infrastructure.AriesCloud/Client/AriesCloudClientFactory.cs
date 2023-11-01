using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
        private readonly IRepository<Models.Connection> _connectionRepository;
        #endregion

        #region Constructor
        public AriesCloudClientFactory(IOptions<AppSettings> appSettings,
            ClientFactory clientFactory,
            ISSEListenerService sseListenerService,
            IMemoryCache memoryCache,
            IRepository<Models.CredentialSchema> credentialSchemaRepository,
            IRepository<Models.Connection> connectionRepository)
        {
            _appSettings = appSettings.Value;
            _clientFactory = clientFactory;
            _sseListenerService = sseListenerService;
            _memoryCache = memoryCache;
            _credentialSchemaRepository = credentialSchemaRepository;
            _connectionRepository = connectionRepository;
        }
        #endregion

        #region Public Members
        public ISSIProviderClient CreateClient()
        {
            return new AriesCloudClient(_appSettings, _clientFactory, _memoryCache, _sseListenerService, _credentialSchemaRepository, _connectionRepository);
        }
        #endregion
    }
}
