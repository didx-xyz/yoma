using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.PartnerSharing.Interfaces.Lookups;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;

namespace Yoma.Core.Domain.PartnerSharing.Services.Lookups
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
      [(Country.SouthAfrica, Country.SouthAfrica.ToDescription()), (Country.Worldwide, Country.Worldwide.ToDescription())];

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

    public List<Models.Lookups.Partner> ListForScheduling(ProcessingAction action, EntityType entityType, Guid entityId)
    {
      //active partners that have the action enabled
      var partners = List().Where(o => o.Active && o.ActionEnabledParsed[action]).ToList();
      var results = new List<Models.Lookups.Partner>();

      //filter based on partner and entity type specific exclusions
      foreach (var item in partners)
      {
        var partner = Enum.Parse<Partner>(item.Name, true);
        switch (entityType)
        {
          case EntityType.Opportunity:
            var opportunity = _opportunityService.GetById(entityId, true, false, false);

            //once shared, flag can not be disabled
            if (opportunity.ShareWithPartners != true)
            {
              _logger.LogInformation("Partner sharing filtering: Entity '{entityType}' with id '{entityId}' not flagged for sharing and will be skipped", EntityType.Opportunity, entityId);
              continue;
            }

            if (opportunity.Hidden == true)
              throw new InvalidOperationException($"Invalid state detected: Entity {EntityType.Opportunity} with id {entityId} is hidden but has sharing enabled");

            switch (partner)
            {
              case Partner.SAYouth:
                //only include opportunities of type learning, within countries World-Wide or South Africa and with an end date
                //once shared, the type can not be changed
                if (opportunity.Type != Opportunity.Type.Learning.ToString())
                {
                  _logger.LogInformation("Partner sharing filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' is not a learning type and will be skipped",
                    EntityType.Opportunity, entityId, partner);
                  continue;
                }

                //once shared, end date can be changed but not removed
                if (!opportunity.DateEnd.HasValue)
                {
                  _logger.LogInformation("Partner sharing filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' does not have an end date and will be skipped",
                    EntityType.Opportunity, entityId, partner);
                  continue;
                }

                //once shared, requird countries can not be removed but can be added
                if (opportunity.Countries == null ||
                  !opportunity.Countries.Any(c => RequiredCountries_AnyOf_SAYouth.Any(s => string.Equals(s.CodeAlpha2, c.CodeAlpha2, StringComparison.InvariantCultureIgnoreCase))))
                {
                  _logger.LogInformation(
                    "Partner sharing filtering: Entity '{entityType}' with id '{entityId}' for partner '{partner}' is not associated with any of the required countries '{requiredCountries}' and will be skipped",
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
    private static Dictionary<ProcessingAction, bool> ParseActionEnabled(Guid id, string? jsonValue)
    {
      jsonValue = jsonValue?.Trim();

      var resultsDefault = Enum.GetValues<ProcessingAction>()
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
