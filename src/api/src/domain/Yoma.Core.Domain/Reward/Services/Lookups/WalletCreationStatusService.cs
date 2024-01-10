using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Reward.Interfaces.Lookups;

namespace Yoma.Core.Domain.Reward.Services.Lookups
{
    public class WalletCreationStatusService : IWalletCreationStatusService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.Lookups.WalletCreationStatus> _walletCreationStatusRepository;
        #endregion

        #region Constructor
        public WalletCreationStatusService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<Models.Lookups.WalletCreationStatus> walletCreationStatusRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _walletCreationStatusRepository = walletCreationStatusRepository;
        }
        #endregion

        #region Public Members
        public Models.Lookups.WalletCreationStatus GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.WalletCreationStatus)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public Models.Lookups.WalletCreationStatus? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => o.Name == name);
        }

        public Models.Lookups.WalletCreationStatus GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.WalletCreationStatus)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public Models.Lookups.WalletCreationStatus? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<Models.Lookups.WalletCreationStatus> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
                return _walletCreationStatusRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(Models.Lookups.WalletCreationStatus), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _walletCreationStatusRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.WalletCreationStatus)}s'");
            return result;
        }
        #endregion
    }
}
