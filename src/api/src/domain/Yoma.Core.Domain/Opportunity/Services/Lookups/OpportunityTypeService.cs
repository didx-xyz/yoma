using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Opportunity.Services.Lookups
{
  public class OpportunityTypeService : IOpportunityTypeService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.OpportunityType> _opportunityTypeRepository;
    #endregion

    #region Constructor
    public OpportunityTypeService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.OpportunityType> opportunityTypeRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _opportunityTypeRepository = opportunityTypeRepository;
    }
    #endregion

    #region Public Members
    public Models.Lookups.OpportunityType GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.OpportunityType)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Lookups.OpportunityType? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Lookups.OpportunityType GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.OpportunityType)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.OpportunityType? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.OpportunityType> Contains(string value)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      return List().Where(o => o.Name.Contains(value, StringComparison.CurrentCultureIgnoreCase)).ToList();
    }

    public List<Models.Lookups.OpportunityType> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _opportunityTypeRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.OpportunityType>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _opportunityTypeRepository.Query()
          .OrderBy(o => o.Name == Type.Other.ToString()) //  Move "Other" to the end
          .ThenBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.OpportunityType)}s'");
      return result;
    }
    #endregion
  }
}
