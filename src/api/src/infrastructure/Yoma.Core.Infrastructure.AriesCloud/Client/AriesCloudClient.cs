using AriesCloudAPI.DotnetSDK.AspCore.Clients;
using Yoma.Core.Domain.SSI.Interfaces.Provider;
using Yoma.Core.Domain.SSI.Models.Provider;

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
        public async Task<List<Schema>> ListSchemas()
        {
            var client = _clientFactory.CreateGovernanceClient();

            var results = await client.GetSchemasAsync();

            return results.Select(o => new Schema
            {
                Id = o.Id,
                Name = o.Name,
                Version = Version.Parse(o.Version),
                AttributeNames = o.Attribute_names
            }).ToList();
        }
        #endregion
    }
}
