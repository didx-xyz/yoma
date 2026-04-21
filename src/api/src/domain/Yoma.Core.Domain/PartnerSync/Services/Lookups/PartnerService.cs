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
      IRepository<Models.Lookups.Partner> partnerRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _opportunityService = opportunityService;
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

      //filter based on partner and entity type specific exclusions
      foreach (var item in partners)
      {
        var partner = Enum.Parse<SyncPartner>(item.Name, true);
        switch (entityType.Value)
        {
          case EntityType.Opportunity:
            var opportunity = _opportunityService.GetById(entityId.Value, true, false, false);

            //once shared, flag can not be disabled
            if (opportunity.ShareWithPartners != true)
            {
              if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Partner sync filtering: Entity '{entityType}' with id '{entityId}' not flagged for partner sync and will be skipped", EntityType.Opportunity, entityId);
              continue;
            }

            if (opportunity.Hidden == true)
              throw new InvalidOperationException($"Invalid state detected: Entity {EntityType.Opportunity} with id {entityId} is hidden but has partner sync enabled");

            switch (partner)
            {
              case SyncPartner.SAYouth:
                //only include opportunities of type learning, within countries World-Wide or South Africa and with an end date
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

                break;

              default:
                throw new InvalidOperationException($"Partner of '{partner}' not supported");
            }
            break;

          default:
            throw new InvalidOperationException($"Entity type of '{entityType}' not supported");
        }

        results.Add(item);
      }

      return results;
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

    #endregion
  }
}
