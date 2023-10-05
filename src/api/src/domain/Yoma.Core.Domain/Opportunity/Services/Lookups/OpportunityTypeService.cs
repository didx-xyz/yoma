using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Services.Lookups
{
    public class OpportunityTypeService : IOpportunityTypeService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<OpportunityType> _opportunityTypeRepository;
        #endregion

        #region Constructor
        public OpportunityTypeService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<OpportunityType> opportunityTypeRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _opportunityTypeRepository = opportunityTypeRepository;
        }
        #endregion

        #region Public Members
        public OpportunityType GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(OpportunityType)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public OpportunityType? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => o.Name == name);
        }

        public OpportunityType GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(OpportunityType)} with '{id}' does not exists", nameof(id));
            return result;
        }

        public OpportunityType? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<OpportunityType> Contains(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentNullException(nameof(value));
            value = value.Trim();

            return List().Where(o => o.Name.Contains(value, StringComparison.CurrentCultureIgnoreCase)).ToList();
        }

        public List<OpportunityType> List()
        {
            if (!_appSettings.CacheEnabledByCacheItemTypes.HasFlag(Core.CacheItemType.Lookups))
                return _opportunityTypeRepository.Query().OrderBy(o => o.Name).ToList();

            var result = _memoryCache.GetOrCreate(nameof(OpportunityType), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
                return _opportunityTypeRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(OpportunityType)}s'");
            return result;
        }
        #endregion
    }
}
