using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using Yoma.Core.Domain.SSIProvider.Interfaces;

namespace Yoma.Core.Infrastructure.AriesCloud.Client
{
    public class AriesCloudClient : ISSIProviderClient
    {
        #region Class Variables
        private readonly ClientFactory _clientFactory;
        #endregion

        #region Constructor
        public AriesCloudClient(ClientFactory clientFactory)
        {
            _clientFactory = clientFactory;
        }
        #endregion

        #region Public Members
        #endregion
    }
}
