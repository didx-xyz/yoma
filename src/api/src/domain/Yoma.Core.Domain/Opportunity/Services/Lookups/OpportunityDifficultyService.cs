using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Domain.Opportunity.Services.Lookups
{
  public class OpportunityDifficultyService : IOpportunityDifficultyService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<OpportunityDifficulty> _opportunityDifficultyRepository;
    #endregion

    #region Constructor
    public OpportunityDifficultyService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<OpportunityDifficulty> opportunityDifficultyRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _opportunityDifficultyRepository = opportunityDifficultyRepository;
    }
    #endregion

    #region Public Members
    public OpportunityDifficulty GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(OpportunityDifficulty)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public OpportunityDifficulty? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public OpportunityDifficulty GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(OpportunityDifficulty)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public OpportunityDifficulty? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<OpportunityDifficulty> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _opportunityDifficultyRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<OpportunityDifficulty>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _opportunityDifficultyRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(OpportunityDifficulty)}s'");
      return result;
    }
    #endregion
  }
}
