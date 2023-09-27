using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using Microsoft.Extensions.Caching.Memory;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Provider;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClientFactory : ISSIProviderClientFactory
    {
        #region Class Variables
        private readonly ClientFactory _clientFactory;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.CredentialSchema> _credentialSchemaRepository;
        #endregion

        #region Constructor
        public AriesCloudClientFactory(ClientFactory clientFactory,
            IMemoryCache memoryCache,
            IRepository<Models.CredentialSchema> credentialSchemaRepository)
        {
            _clientFactory = clientFactory;
            _memoryCache = memoryCache;
            _credentialSchemaRepository = credentialSchemaRepository;
        }
        #endregion

        #region Public Members
        public ISSIProviderClient CreateClient()
        {
            return new AriesCloudClient(_clientFactory, _memoryCache, _credentialSchemaRepository);
        }
        #endregion
    }
}
