using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;

namespace Yoma.Core.Domain.Entity.Services.Lookups
{
  public class OrganizationProviderTypeService : IOrganizationProviderTypeService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.OrganizationProviderType> _providerTypeRepository;
    #endregion

    #region Constructor
    public OrganizationProviderTypeService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.OrganizationProviderType> providerTypeRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _providerTypeRepository = providerTypeRepository;
    }
    #endregion

    #region Public Members
    public Models.Lookups.OrganizationProviderType GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(OrganizationProviderType)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.OrganizationProviderType? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.OrganizationProviderType> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _providerTypeRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(nameof(Models.Lookups.OrganizationProviderType), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _providerTypeRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.OrganizationProviderType)}s'");
      return result;
    }
    #endregion
  }
}
