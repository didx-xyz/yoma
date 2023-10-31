using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services.Lookups
{
    public class SSIWalletCreationStatusService : ISSIWalletCreationStatusService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<SSIWalletCreationStatus> _ssiWalletCreationStatusRepository;
        #endregion

        #region Constructor
        public SSIWalletCreationStatusService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<SSIWalletCreationStatus> ssiWalletCreationStatusRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _ssiWalletCreationStatusRepository = ssiWalletCreationStatusRepository;
        }
        #endregion

        #region Public Members
        public SSIWalletCreationStatus GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(SSIWalletCreationStatus)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public SSIWalletCreationStatus? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => o.Name == name);
        }

        public SSIWalletCreationStatus GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(SSIWalletCreationStatus)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public SSIWalletCreationStatus? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<SSIWalletCreationStatus> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypes.HasFlag(Core.CacheItemType.Lookups))
                return _ssiWalletCreationStatusRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(SSIWalletCreationStatus), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _ssiWalletCreationStatusRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SSIWalletCreationStatus)}s'");
            return result;
        }
        #endregion
    }
}
