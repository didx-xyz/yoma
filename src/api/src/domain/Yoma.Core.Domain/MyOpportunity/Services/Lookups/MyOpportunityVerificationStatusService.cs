using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models.Lookups;

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

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public MyOpportunityVerificationStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(MyOpportunityVerificationStatus)} with '{id}' does not exists", nameof(id));
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
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _myOpportunityVerificationStatusRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<MyOpportunityVerificationStatus>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _myOpportunityVerificationStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(MyOpportunityVerificationStatus)}s'");
      return result;
    }
    #endregion
  }
}
