using Microsoft.Extensions.Options;
using Yoma.Core.Domain.RewardsProvider.Interfaces;
using Yoma.Core.Infrastructure.Zlto.Models;

namespace Yoma.Core.Infrastructure.Zlto.Client
{
    public class ZltoClientFactory : IRewardsProviderClientFactory
    {
        #region Class Variables
        private readonly ZltoOptions _options;
        #endregion

        #region Constructor
        public ZltoClientFactory(IOptions<ZltoOptions> options)
        {
            _options = options.Value;
        }
        #endregion

        #region Public Members
        public IRewardsProviderClient CreateClient()
        {
            return new ZltoClient(_options);
        }
        #endregion
    }
}
