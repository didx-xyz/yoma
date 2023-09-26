using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using Yoma.Core.Domain.SSI.Interfaces.Provider;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClientFactory : ISSIProviderClientFactory
    {
        #region Class Variables
        private readonly ClientFactory _clientFactory;
        #endregion

        #region Constructor
        public AriesCloudClientFactory(ClientFactory clientFactory)
        {
            _clientFactory = clientFactory;
        }
        #endregion

        #region Public Members
        public ISSIProviderClient CreateClient()
        {
            return new AriesCloudClient(_clientFactory);
        }
        #endregion
    }
}
