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
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.PartnerSync.Interfaces.Lookups;

namespace Yoma.Core.Domain.PartnerSync.Services.Lookups
{
  public class PartnerService : IPartnerService
  {
    #region Class Variables
    private readonly ILogger<PartnerService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IOpportunityService _opportunityService;
    private readonly ICountryService _countryService;
    private readonly IRepository<Models.Lookups.Partner> _partnerRepository;

    private static readonly (Country Country, string CodeAlpha2)[] RequiredCountries_AnyOf_SAYouth =
    [
      (Country.SouthAfrica, Country.SouthAfrica.ToDescription())
    ];

    public static readonly (Country Country, string CodeAlpha2)[] RequiredCountries_AnyOf_All = RequiredCountries_AnyOf_SAYouth;
    #endregion

    #region Constructor
    public PartnerService(ILogger<PartnerService> logger,
      IOptions<AppSettings> appSettings,
      IMemoryCache memoryCache,
      IOpportunityService opportunityService,
      ICountryService countryService,
      IRepository<Models.Lookups.Partner> partnerRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _opportunityService = opportunityService;
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

    public List<Models.Lookups.Partner> ListPull(SyncAction? action, EntityType? entityType)
    {
      //active partners that support pull for the specified entity type and action
      var results = ListCached()
        .Where(o => o.Active
          && (!action.HasValue || o.ActionEnabledParsed.Contains(action.Value))
          && o.SyncTypesEnabledParsed.TryGetValue(SyncType.Pull, out var entityTypes)
          && (!entityType.HasValue || entityTypes.Contains(entityType.Value)))
        .ToList();

      return results;
    }

    public List<Models.Lookups.Partner> ListPush(SyncAction? action, EntityType? entityType, Guid? entityId)
    {
      //active partners that support push for the specified entity type and action
      var partners = ListCached()
        .Where(o => o.Active
          && (!action.HasValue || o.ActionEnabledParsed.Contains(action.Value))
          && o.SyncTypesEnabledParsed.TryGetValue(SyncType.Push, out var entityTypes)
          && (!entityType.HasValue || entityTypes.Contains(entityType.Value)))
        .ToList();

      var results = new List<Models.Lookups.Partner>();

      if (!entityType.HasValue && !entityId.HasValue) return partners;

      if (!entityType.HasValue)
        throw new ArgumentNullException(nameof(entityType), $"'{nameof(entityType)}' is required when '{nameof(entityId)}' is provided");

      if (!entityId.HasValue)
        throw new ArgumentNullException(nameof(entityId), $"'{nameof(entityId)}' is required when '{nameof(entityType)}' is provided");

      switch (entityType.Value)
      {
        case EntityType.Opportunity:
          var opportunity = _opportunityService.GetById(entityId.Value, true, true, false);

          foreach (var item in partners)
          {
            var partner = Enum.Parse<SyncPartner>(item.Name, true);

            //once shared, flag can not be disabled
            if (opportunity.ShareWithPartners != true)
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: Entity '{entityType}' with id '{entityId}' not flagged for partner sync and will be skipped", EntityType.Opportunity, entityId);
              continue;
            }

            //pull-synchronized opportunity: managed by an external partner; sharing via push-synchronization not allowed
            if (opportunity.SyncedInfo?.Locked == true)
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: {EntityType} '{EntityId}' is externally managed (pull-synced); skipping push sync", EntityType.Opportunity, entityId);
              continue;
            }

            if (opportunity.Hidden == true)
              throw new InvalidOperationException($"Invalid state detected: Entity {EntityType.Opportunity} with id {entityId} is hidden but has partner sync enabled");

            switch (partner)
            {
              case SyncPartner.SAYouth:
                //only include opportunities of type learning, associated with South Africa and with an end date
                //once shared, the type can not be changed
                if (!string.Equals(opportunity.Type, Opportunity.Type.Learning.ToString(), StringComparison.OrdinalIgnoreCase))
                {
                  if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' is not a learning type and will be skipped",
                    EntityType.Opportunity, entityId, partner);
                  continue;
                }

                //once shared, end date can be changed but not removed
                if (!opportunity.DateEnd.HasValue)
                {
                  if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' does not have an end date and will be skipped",
                    EntityType.Opportunity, entityId, partner);
                  continue;
                }

                //once shared, required countries can not be removed but can be added
                if (opportunity.Countries == null ||
                  !opportunity.Countries.Any(c => RequiredCountries_AnyOf_SAYouth.Any(s => string.Equals(s.CodeAlpha2, c.CodeAlpha2, StringComparison.OrdinalIgnoreCase))))
                {
                  if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation(
                    "Partner sync filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' is not associated with any of the required countries '{requiredCountries}' and will be skipped",
                    EntityType.Opportunity, entityId, partner, string.Join(", ", RequiredCountries_AnyOf_SAYouth.Select(c => c.Country)));
                  continue;
                }

                results.Add(item);
                break;

              default:
                throw new InvalidOperationException($"Partner of '{partner}' not supported");
            }
          }
          break;

        default:
          throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
      }

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
