using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.ActionLink.Interfaces.Lookups;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.ActionLink.Services.Lookups
{
  public class LinkStatusService : ILinkStatusService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.LinkStatus> _linkStatusRepository;
    #endregion

    #region Constructor
    public LinkStatusService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.LinkStatus> linkStatusRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _linkStatusRepository = linkStatusRepository;
    }
    #endregion

    #region Public Members
    public Models.Lookups.LinkStatus GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.LinkStatus)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Lookups.LinkStatus? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Lookups.LinkStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.LinkStatus)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.LinkStatus? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.LinkStatus> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _linkStatusRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.LinkStatus>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _linkStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.LinkStatus)}s'");
      return result;
    }
    #endregion
  }
}
