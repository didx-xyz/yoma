using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models.Lookups;
using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.MyOpportunity.Services.Lookups
{
    public class MyOpportunityVerificationStatusService : IMyOpportunityVerificationStatusService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<MyOpportunityVerificationStatus> _myOpportunityVerificationStatusRepository;
        #endregion

        #region Constructor
        public MyOpportunityVerificationStatusService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<MyOpportunityVerificationStatus> myOpportunityVerificationStatusRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _myOpportunityVerificationStatusRepository = myOpportunityVerificationStatusRepository;
        }
        #endregion

        #region Public Members
        public MyOpportunityVerificationStatus GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(MyOpportunityVerificationStatus)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public MyOpportunityVerificationStatus? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => o.Name == name);
        }

        public MyOpportunityVerificationStatus GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(MyOpportunityVerificationStatus)} for '{id}' does not exists", nameof(id));
            return result;
        }

        public MyOpportunityVerificationStatus? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<MyOpportunityVerificationStatus> List()
        {
            if (!_appSettings.CacheEnabledByReferenceDataTypes.HasFlag(Core.ReferenceDataType.Lookups))
                return _myOpportunityVerificationStatusRepository.Query().ToList();

            var result = _memoryCache.GetOrCreate(nameof(MyOpportunityVerificationStatus), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationLookupInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowLookupInDays);
                return _myOpportunityVerificationStatusRepository.Query().OrderBy(o => o.Name).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(MyOpportunityVerificationStatus)}s'");
            return result;
        }
        #endregion
    }
}
