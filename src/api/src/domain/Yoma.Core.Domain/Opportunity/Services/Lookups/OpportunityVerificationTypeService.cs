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
    public OpportunityVerificationType GetByType(VerificationType type)
    {
      var result = GetByTypeOrNull(type) ?? throw new ArgumentException($"{nameof(OpportunityVerificationType)} of type '{type}' does not exists", nameof(type));
      return result;
    }

    public OpportunityVerificationType? GetByTypeOrNull(VerificationType type)
    {
      return List().SingleOrDefault(o => o.Type == type);
    }

    public OpportunityVerificationType GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(OpportunityVerificationType)} with '{id}' does not exists", nameof(id));
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
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _opportunityVerificationTypeRepository.Query().OrderBy(o => o.DisplayName)];

      var result = _memoryCache.GetOrCreate(nameof(OpportunityVerificationType), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _opportunityVerificationTypeRepository.Query().OrderBy(o => o.DisplayName).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(OpportunityVerificationType)}s'");
      return result;
    }
    #endregion
  }
}
