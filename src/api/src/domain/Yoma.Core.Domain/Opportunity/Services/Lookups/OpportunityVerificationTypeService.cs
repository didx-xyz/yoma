using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Services.Lookups
{
    public class OpportunityVerificationTypeService : IOpportunityVerificationTypeService
    {
        #region Class Variables
        private readonly AppSettings _appSettings;
        private readonly IMemoryCache _memoryCache;
        private readonly IRepository<OpportunityVerificationType> _opportunityVerificationTypeRepository;
        #endregion

        #region Constructor
        public OpportunityVerificationTypeService(IOptions<AppSettings> appSettings,
            IMemoryCache memoryCache,
            IRepository<OpportunityVerificationType> opportunityVerificationTypeRepository)
        {
            _appSettings = appSettings.Value;
            _memoryCache = memoryCache;
            _opportunityVerificationTypeRepository = opportunityVerificationTypeRepository;
        }
        #endregion

        #region Public Members
        public OpportunityVerificationType GetByName(string name)
        {
            var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(OpportunityVerificationType)} with name '{name}' does not exists", nameof(name));
            return result;
        }

        public OpportunityVerificationType? GetByNameOrNull(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentNullException(nameof(name));
            name = name.Trim();

            return List().SingleOrDefault(o => o.Name == name);
        }

        public OpportunityVerificationType GetById(Guid id)
        {
            var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(OpportunityVerificationType)} for '{id}' does not exists", nameof(id));
            return result;
        }

        public OpportunityVerificationType? GetByIdOrNull(Guid id)
        {
            if (id == Guid.Empty)
                throw new ArgumentNullException(nameof(id));

            return List().SingleOrDefault(o => o.Id == id);
        }

        public List<OpportunityVerificationType> List()
        {
            if (!_appSettings.CacheEnabledByReferenceDataTypes.HasFlag(Core.ReferenceDataType.Lookups))
                return _opportunityVerificationTypeRepository.Query().ToList();

            var result = _memoryCache.GetOrCreate(nameof(OpportunityVerificationType), entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationLookupInHours);
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowLookupInDays);
                return _opportunityVerificationTypeRepository.Query().OrderBy(o => o.DisplayName).ToList();
            }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(OpportunityVerificationType)}s'");
            return result;
        }
        #endregion
    }
}
