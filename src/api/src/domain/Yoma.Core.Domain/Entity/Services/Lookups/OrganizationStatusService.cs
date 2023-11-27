using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Entity.Services.Lookups
{
    public class OrganizationStatusService : IOrganizationStatusService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<Models.Lookups.OrganizationStatus> _organizationStatusRepository;
        #endregion

        #region Constructor
        public OrganizationStatusService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<Models.Lookups.OrganizationStatus> organizationStatusRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _organizationStatusRepository = organizationStatusRepository;
        }
        #endregion

        #region Public Members
        public Models.Lookups.OrganizationStatus GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.OrganizationStatus)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public Models.Lookups.OrganizationStatus? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => o.Name == name);
        }

        public Models.Lookups.OrganizationStatus GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.OrganizationStatus)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public Models.Lookups.OrganizationStatus? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<Models.Lookups.OrganizationStatus> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
                return _organizationStatusRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(Models.Lookups.OrganizationStatus), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _organizationStatusRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.OrganizationStatus)}s'");
            return result;
        }
        #endregion
    }
}

