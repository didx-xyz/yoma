using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Marketplace.Interfaces.Provider;
using Yoma.Core.Domain.Reward.Interfaces.Provider;
using Yoma.Core.Infrastructure.Zlto.Models;

namespace Yoma.Core.Infrastructure.Zlto.Client
{
    public class ZltoClientFactory : IRewardProviderClientFactory, IMarketplaceProviderClientFactory
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly ZltoOptions _options;
        private readonly IMemoryCache _memoryCache;
        #endregion

        #region Constructor
        public ZltoClientFactory(IOptions<AppSettings> appSettings,
            IOptions<ZltoOptions> options,
            IMemoryCache memoryCache)
        {
            _appSettings = appSettings.Value;   
            _options = options.Value;
            _memoryCache = memoryCache;
        }
        #endregion

        #region Public Members
        IMarketplaceProviderClient IMarketplaceProviderClientFactory.CreateClient()
        {
            return new ZltoClient(_appSettings, _options, _memoryCache);
        }

        IRewardProviderClient IRewardProviderClientFactory.CreateClient()
        {
            return new ZltoClient(_appSettings, _options, _memoryCache);
        }
        #endregion
    }
}
