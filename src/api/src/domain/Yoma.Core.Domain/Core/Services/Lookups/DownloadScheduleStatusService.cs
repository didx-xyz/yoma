using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Interfaces.Lookups;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Services.Lookups
{
  public class DownloadScheduleStatusService : IDownloadScheduleStatusService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.DownloadScheduleStatus> _downloadScheduleStatusRepository;
    #endregion

    #region Constructor
    public DownloadScheduleStatusService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.DownloadScheduleStatus> downloadScheduleStatusRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _downloadScheduleStatusRepository = downloadScheduleStatusRepository;
    }
    #endregion

    #region Public Members
    public Models.Lookups.DownloadScheduleStatus GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.DownloadScheduleStatus)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Lookups.DownloadScheduleStatus? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Lookups.DownloadScheduleStatus GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.DownloadScheduleStatus)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.DownloadScheduleStatus? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.DownloadScheduleStatus> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
        return [.. _downloadScheduleStatusRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.DownloadScheduleStatus>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return _downloadScheduleStatusRepository.Query().OrderBy(o => o.Name).ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.DownloadScheduleStatus)}s'");
      return result;
    }
    #endregion
  }
}
