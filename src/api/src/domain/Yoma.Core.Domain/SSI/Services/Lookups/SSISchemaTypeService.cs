using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Domain.SSI.Services.Lookups
{
  public class SSISchemaTypeService : ISSISchemaTypeService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<SSISchemaType> _schemaTypeRepository;
    #endregion

    #region Constructor
    public SSISchemaTypeService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<SSISchemaType> schemaTypeRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _schemaTypeRepository = schemaTypeRepository;
    }
    #endregion

    #region Public Members
    public SSISchemaType GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(SSISchemaType)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public SSISchemaType? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public SSISchemaType GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(SSISchemaType)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public SSISchemaType? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<SSISchemaType> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return _schemaTypeRepository.Query().OrderBy(o => o.Name).ToList();

      var result = _memoryCache.GetOrCreate(nameof(SSISchemaType), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _schemaTypeRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(SSISchemaType)}s'");
      return result;
    }
    #endregion
  }
}
