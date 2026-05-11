using FluentValidation;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;

namespace Yoma.Core.Domain.PartnerSync.Services.Lookups
{
  public class PartnerService : IPartnerService
  {
    #region Class Variables
    private readonly ILogger<PartnerService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly ICountryService _countryService;
    private readonly IRepository<Models.Lookups.Partner> _partnerRepository;

    public static readonly (Country Country, string CodeAlpha2)[] RequiredCountries_AnyOf_SAYouth =
    [
      (Country.SouthAfrica, Country.SouthAfrica.ToDescription())
    ];

    public static readonly (Country Country, string CodeAlpha2)[] RequiredCountries_AnyOf_All = RequiredCountries_AnyOf_SAYouth;
    #endregion

    #region Constructor
    public PartnerService(ILogger<PartnerService> logger,
      IOptions<AppSettings> appSettings,
      IMemoryCache memoryCache,
      ICountryService countryService,
      IRepository<Models.Lookups.Partner> partnerRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _countryService = countryService;
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

      return ListCached().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.OrdinalIgnoreCase));
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

      return ListCached().SingleOrDefault(o => o.Id == id);
    }

    /// <summary>
    /// Lists active partners configured for pull synchronization for the specified action and entity type.
    /// Additional entity-specific filtering is handled by the processing service where required.
    /// </summary>
    public List<Models.Lookups.Partner> ListPull(SyncAction? action, EntityType? entityType)
    {
      var results = ListCached()
        .Where(o => o.Active
          && (!action.HasValue || o.ActionEnabledParsed.Contains(action.Value))
          && o.SyncTypesEnabledParsed.TryGetValue(SyncType.Pull, out var entityTypes)
          && (!entityType.HasValue || entityTypes.Contains(entityType.Value)))
        .ToList();

      return results;
    }

    /// <summary>
    /// Lists active partners configured for push synchronization for the specified action and entity type.
    /// Additional entity-specific filtering may be handled by the processing service where required.
    /// </summary>
    public List<Models.Lookups.Partner> ListPush(SyncAction? action, EntityType? entityType)
    {
      //active partners that support push for the specified entity type and action
      var results = ListCached()
        .Where(o => o.Active
          && (!action.HasValue || o.ActionEnabledParsed.Contains(action.Value))
          && o.SyncTypesEnabledParsed.TryGetValue(SyncType.Push, out var entityTypes)
          && (!entityType.HasValue || entityTypes.Contains(entityType.Value)))
        .ToList();

      return results;
    }

    /// <summary>
    /// Validates partner-specific update restrictions for push-synchronized opportunities.
    /// These rules apply after an opportunity has been shared with one or more partners.
    /// </summary>
    public List<string> ValidateUpdatablePush(
      Opportunity.Models.Opportunity opportunityCurrent,
      UpdateAction action,
      Dictionary<string, object?> updatesToEval,
      List<SyncPartner> partners)
    {
      ArgumentNullException.ThrowIfNull(opportunityCurrent);
      ArgumentNullException.ThrowIfNull(updatesToEval);
      ArgumentNullException.ThrowIfNull(partners);

      var reasons = new List<string>();

      if (partners.Count == 0) return reasons;

      foreach (var partner in partners.Distinct())
      {
        switch (partner)
        {
          case SyncPartner.SAYouth:
            switch (action)
            {
              case UpdateAction.Complete:
                var typeId = updatesToEval.Get<Guid>(nameof(Opportunity.Models.Opportunity.TypeId));
                var dateEnd = updatesToEval.Get<DateTimeOffset?>(nameof(Opportunity.Models.Opportunity.DateEnd));

                if (opportunityCurrent.TypeId != typeId)
                  reasons.Add("Type cannot be changed");

                if (opportunityCurrent.DateEnd.HasValue && !dateEnd.HasValue)
                  reasons.Add("End date cannot be removed once it has been set");

                AssertRequiredCountriesNotRemoved(opportunityCurrent, updatesToEval, reasons);
                break;

              case UpdateAction.Countries:
                AssertRequiredCountriesNotRemoved(opportunityCurrent, updatesToEval, reasons);
                break;

              case UpdateAction.Hidden:
              case UpdateAction.Featured:
              case UpdateAction.Status:
              case UpdateAction.Other:
                break;

              default:
                throw new InvalidOperationException($"Unsupported update action: {action}");
            }

            break;

          default:
            throw new InvalidOperationException($"Partner '{partner}' not supported");
        }
      }

      return [.. reasons.Distinct()];
    }
    #endregion

    #region Private Members
    private List<Models.Lookups.Partner> ListCached()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(CacheItemType.Lookups))
        return List();

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Models.Lookups.Partner>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        return List();

      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Models.Lookups.Partner)}s'");
      return result;
    }

    private List<Models.Lookups.Partner> List()
    {
      var results = _partnerRepository.Query().OrderBy(o => o.Name).ToList();
      results.ForEach(item =>
      {
        item.ActionEnabledParsed = ParseActionEnabled(item.Id, item.ActionEnabled);
        item.SyncTypesEnabledParsed = ParseSyncTypesEnabled(item.Id, item.SyncTypesEnabled);
      });
      return results;
    }

    private static List<SyncAction> ParseActionEnabled(Guid id, string? jsonValue)
    {
      jsonValue = jsonValue?.Trim();

      if (string.IsNullOrEmpty(jsonValue))
        return [.. Enum.GetValues<SyncAction>()];

      var resultsSavedAsString = JsonConvert.DeserializeObject<List<string>>(jsonValue)
        ?? throw new DataInconsistencyException($"Failed to parse enabled actions for partner with id '{id}'");

      var results = resultsSavedAsString
        .Select(value => Enum.TryParse(typeof(SyncAction), value, true, out var action)
          ? (SyncAction)action
          : throw new DataInconsistencyException($"Unsupported / invalid processing action of '{value}' specified for partner with id '{id}'"))
        .Distinct()
        .ToList();

      return results;
    }

    private static Dictionary<SyncType, List<EntityType>> ParseSyncTypesEnabled(Guid id, string jsonValue)
    {
      if (string.IsNullOrWhiteSpace(jsonValue))
        throw new DataInconsistencyException($"Sync types enabled configuration is required for partner with id '{id}'");

      var resultsSavedAsString = JsonConvert.DeserializeObject<Dictionary<string, List<string>>>(jsonValue.Trim())
        ?? throw new DataInconsistencyException($"Failed to parse sync types enabled configuration for partner with id '{id}'");

      var results = resultsSavedAsString.ToDictionary(
        kvp => Enum.TryParse(typeof(SyncType), kvp.Key, true, out var syncType)
          ? (SyncType)syncType
          : throw new DataInconsistencyException($"Unsupported / invalid sync type of '{kvp.Key}' specified for partner with id '{id}'"),
        kvp => kvp.Value?.Select(value =>
            Enum.TryParse(typeof(EntityType), value, true, out var entityType)
              ? (EntityType)entityType
              : throw new DataInconsistencyException($"Unsupported / invalid entity type of '{value}' specified for sync type '{kvp.Key}' and partner with id '{id}'"))
          .Distinct()
          .ToList()
          ?? throw new DataInconsistencyException($"Entity types are required for sync type '{kvp.Key}' and partner with id '{id}'")
      );

      return results;
    }

    private void AssertRequiredCountriesNotRemoved(
      Opportunity.Models.Opportunity opportunityCurrent,
      Dictionary<string, object?> updatesToEval,
      List<string> reasons)
    {
      var countries = updatesToEval.Get<List<Guid>>(nameof(Opportunity.Models.Opportunity.Countries));
      if (countries == null) return;

      var requiredCountries = RequiredCountries_AnyOf_All
        .Select(o => o.CodeAlpha2)
        .ToList();

      var countriesCurrent = opportunityCurrent.Countries?
        .Select(c => c.CodeAlpha2)
        .Intersect(requiredCountries, StringComparer.OrdinalIgnoreCase)
        .ToList();

      var countriesRequest = countries
        .Select(c => _countryService.GetById(c).CodeAlpha2)
        .Intersect(requiredCountries, StringComparer.OrdinalIgnoreCase)
        .ToList();

      var countriesRemoved = countriesCurrent?
        .Except(countriesRequest, StringComparer.OrdinalIgnoreCase)
        .ToList();

      if (countriesRemoved?.Count > 0)
      {
        var countryNamesRemoved = RequiredCountries_AnyOf_All
          .Where(rc => countriesRemoved.Contains(rc.CodeAlpha2, StringComparer.OrdinalIgnoreCase))
          .Select(rc => rc.Country)
          .ToList();

        reasons.Add($"The following country or countries cannot be removed: '{string.Join(", ", countryNamesRemoved)}'");
      }
    }
    #endregion
  }
}
