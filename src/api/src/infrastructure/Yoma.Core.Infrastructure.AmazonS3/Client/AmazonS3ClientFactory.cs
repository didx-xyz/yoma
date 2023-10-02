using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.BlobProvider;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Infrastructure.AmazonS3.Models;

namespace Yoma.Core.Infrastructure.AmazonS3.Client
{
    public class AmazonS3ClientFactory : IBlobProviderClientFactory
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly AWSS3Options _options;
        #endregion

        #region Constructor
        public AmazonS3ClientFactory(IOptions<AppSettings> appSettings, IMemoryCache memoryCache, IOptions<AWSS3Options> options)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _options = options.Value;
        }
        #endregion

        #region Public Members
        public IBlobProviderClient CreateClient(StorageType storageType)
        {
            if (!_options.Buckets.TryGetValue(storageType, out var optionsBucket) || optionsBucket == null)
                throw new InvalidOperationException($"Failed to retrieve configuration section '{AWSS3Options.Section}' for storage type '{storageType}'");

            if (!_appSettings.CacheEnabledByCacheItemTypes.HasFlag(CacheItemType.AmazonS3Client))
                return new AmazonS3Client(storageType, optionsBucket);

            var result = _memoryCache.GetOrCreate($"{nameof(AmazonS3Client)}:{storageType}", entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return new AmazonS3Client(storageType, optionsBucket);
            }) ?? throw new InvalidOperationException($"Failed to retrieve the '{nameof(AmazonS3Client)} cache item'");
            return result;
        }
        #endregion
    }
}
