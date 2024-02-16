using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Services
{
    public class EducationService : IEducationService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Education> _educationRepository;
        #endregion

        #region Constructor
        public EducationService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<Education> educationRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _educationRepository = educationRepository;
        }
        #endregion

        #region Public Members
        public Education GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Education)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public Education? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
        }

        public Education GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Education)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public Education? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<Education> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
                return _educationRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(Education), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _educationRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Education)}s'");
            return result;
        }
        #endregion
    }
}
