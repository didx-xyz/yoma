using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Services
{
    public class GenderService : IGenderService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Gender> _genderRepository;
        #endregion

        #region Constructor
        public GenderService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<Gender> genderRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _genderRepository = genderRepository;
        }
        #endregion

        #region Public Members
        public Gender GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Gender)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public Gender? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => o.Name == name);
        }

        public Gender GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Gender)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public Gender? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<Gender> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypes.HasFlag(Core.CacheItemType.Lookups))
                return _genderRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(Gender), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _genderRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Gender)}s'");
            return result;
        }
        #endregion
    }
}
