using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models.Lookups;

namespace Yoma.Core.Domain.Entity.Services.Lookups
{
  public class OrganizationProviderTypeService : IOrganizationProviderTypeService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<OrganizationProviderType> _providerTypeRepository;
    #endregion

    #region Constructor
    public OrganizationProviderTypeService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<OrganizationProviderType> providerTypeRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _providerTypeRepository = providerTypeRepository;
    }
    #endregion

    #region Public Members
    public OrganizationProviderType GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(OrganizationProviderType)} for '{id}' does not exists", nameof(id));
      return result;
    }

    public OrganizationProviderType? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<OrganizationProviderType> List()
    {
      if (!_appSettings.CacheEnabledByReferenceDataTypes.HasFlag(Core.ReferenceDataType.Lookups))
        return _providerTypeRepository.Query().ToList();

      var result = _memoryCache.GetOrCreate(nameof(OrganizationProviderType), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationLookupInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowLookupInDays);
        return _providerTypeRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(OrganizationProviderType)}s'");
      return result;
    }
    #endregion
  }
}
