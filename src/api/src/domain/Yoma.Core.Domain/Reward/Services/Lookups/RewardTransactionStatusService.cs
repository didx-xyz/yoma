using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Reward.Interfaces.Lookups;

namespace Yoma.Core.Domain.Reward.Services.Lookups
{
    public class RewardTransactionStatusService : IRewardTransactionStatusService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.Lookups.RewardTransactionStatus> _rewardTransactionStatusRepository;
        #endregion

        #region Constructor
        public RewardTransactionStatusService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<Models.Lookups.RewardTransactionStatus> rewardTransactionStatusRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _rewardTransactionStatusRepository = rewardTransactionStatusRepository;
        }
        #endregion

        #region Public Members
        public Models.Lookups.RewardTransactionStatus GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.RewardTransactionStatus)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public Models.Lookups.RewardTransactionStatus? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
        }

        public Models.Lookups.RewardTransactionStatus GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.RewardTransactionStatus)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public Models.Lookups.RewardTransactionStatus? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<Models.Lookups.RewardTransactionStatus> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
                return _rewardTransactionStatusRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(Models.Lookups.RewardTransactionStatus), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _rewardTransactionStatusRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.RewardTransactionStatus)}s'");
            return result;
        }
        #endregion
    }
}

