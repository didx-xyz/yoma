using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Provider;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClientFactory : ISSIProviderClientFactory
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ClientFactory _clientFactory;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
        private readonly IRepository<Models.Connection> _connectionRepository;
        #endregion

        #region Constructor
        public AriesCloudClientFactory(IOptions<AppSettings> appSettings,
            ClientFactory clientFactory,
            IMemoryCache memoryCache,
            IRepository<Models.CredentialSchema> credentialSchemaRepository,
            IRepository<Models.Connection> connectionRepository)
        {
            _appSettings = appSettings.Value;
            _clientFactory = clientFactory;
            _memoryCache = memoryCache;
            _credentialSchemaRepository = credentialSchemaRepository;
            _connectionRepository = connectionRepository;
        }
        #endregion

        #region Public Members
        public ISSIProviderClient CreateClient()
        {
            return new AriesCloudClient(_appSettings, _clientFactory, _memoryCache, _credentialSchemaRepository, _connectionRepository);
        }
        #endregion
    }
}
