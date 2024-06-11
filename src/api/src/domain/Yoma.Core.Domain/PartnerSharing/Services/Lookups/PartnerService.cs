using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Exceptions;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups;

namespace Yoma.Core.Domain.PartnerSharing.Services.Lookups
{
  public class PartnerService : IPartnerService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IRepository<Models.Lookups.Partner> _partnerRepository;
    #endregion

    #region Constructor
    public PartnerService(IOptions<AppSettings> appSettings,
        IMemoryCache memoryCache,
        IRepository<Models.Lookups.Partner> partnerRepository)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _partnerRepository = partnerRepository;
    }
    #endregion

    #region Public Members
    public Models.Lookups.Partner GetByName(string name)
    {
      var result = GetByNameOrNull(name) ?? throw new ArgumentException($"{nameof(Models.Lookups.Partner)} with name '{name}' does not exists", nameof(name));
      return result;
    }

    public Models.Lookups.Partner? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.InvariantCultureIgnoreCase));
    }

    public Models.Lookups.Partner GetById(Guid id)
    {
      var result = GetByIdOrNull(id) ?? throw new ArgumentException($"{nameof(Models.Lookups.Partner)} with '{id}' does not exists", nameof(id));
      return result;
    }

    public Models.Lookups.Partner? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Models.Lookups.Partner> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _partnerRepository.Query().OrderBy(o => o.Name)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.Partner>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        var items = _partnerRepository.Query().OrderBy(o => o.Name).ToList();
        items.ForEach(item => item.ActionEnabledParsed = ParseActionEnabled(item.Id, item.ActionEnabled));
        return items;

      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.Partner)}s'");
      return result;
    }
    #endregion

    #region Private Members
    private static Dictionary<ProcessingAction, bool> ParseActionEnabled(Guid id, string? jsonValue)
    {
      jsonValue = jsonValue?.Trim();

      var resultsDefault = Enum.GetValues(typeof(ProcessingAction))
                              .Cast<ProcessingAction>()
                              .ToDictionary(action => action, action => true);

      if (string.IsNullOrEmpty(jsonValue)) return resultsDefault;

      var resultsSavedAsString = JsonConvert.DeserializeObject<Dictionary<string, bool>>(jsonValue);

      var resultsSaved = resultsSavedAsString?.ToDictionary(
          kvp => Enum.TryParse(typeof(ProcessingAction), kvp.Key, true, out var action)
          ? (ProcessingAction)action
          : throw new DataInconsistencyException($"Unsupported / invalid processing action of '{kvp.Key}' specified for partner with id '{id}'"),
          kvp => kvp.Value
      );

      var results = resultsDefault.ToDictionary(
          kvp => kvp.Key,
          kvp => resultsSaved != null && resultsSaved.TryGetValue(kvp.Key, out var value) ? value : kvp.Value
      );

      return results;
    }
    #endregion
  }
}
