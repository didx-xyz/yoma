using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services.Lookups
{
  public class SSITenantCreationStatusService : ISSITenantCreationStatusService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<SSITenantCreationStatus> _ssiTenantCreationStatusRepository;
    #endregion

    #region Constructor
    public SSITenantCreationStatusService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<SSITenantCreationStatus> ssiTenantCreationStatusRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _ssiTenantCreationStatusRepository = ssiTenantCreationStatusRepository;
    }
    #endregion

    #region Public Members
    public SSITenantCreationStatus GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(SSITenantCreationStatus)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public SSITenantCreationStatus? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public SSITenantCreationStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(SSITenantCreationStatus)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public SSITenantCreationStatus? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<SSITenantCreationStatus> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _ssiTenantCreationStatusRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(nameof(SSITenantCreationStatus), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _ssiTenantCreationStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SSITenantCreationStatus)}s'");
      return result;
    }
    #endregion
  }
}
