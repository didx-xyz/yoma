using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models.Lookups;

namespace Yoma.Core.Domain.MyOpportunity.Services.Lookups
{
    public class MyOpportunityActionService : IMyOpportunityActionService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<MyOpportunityAction> _myOpportunityActionRepository;
        #endregion

        #region Constructor
        public MyOpportunityActionService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<MyOpportunityAction> myOpportunityActionRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _myOpportunityActionRepository = myOpportunityActionRepository;
        }
        #endregion

        #region Public Members
        public MyOpportunityAction GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(MyOpportunityAction)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public MyOpportunityAction? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
        }

        public MyOpportunityAction GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(MyOpportunityAction)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public MyOpportunityAction? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<MyOpportunityAction> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
                return _myOpportunityActionRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(MyOpportunityAction), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _myOpportunityActionRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(MyOpportunityAction)}s'");
            return result;
        }
        #endregion
    }
}
