using FluentValidation;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;
using Yoma.Core.Domain.Lookups.Validators;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class SkillService : ISkillService
  {
    #region Class Variables
    private readonly ILogger<SkillService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IMemoryCache _memoryCache;
    private readonly ILaborMarketProviderClient _laborMarketProviderClient;
    private readonly SkillSearchFilterValidator _searchFilterValidator;
    private readonly IRepositoryBatchedValueContains<Skill> _skillRepository;
    private readonly IDistributedLockService _distributedLockService;

    // Reviewed cross-framework aliases shared by all consumers. Targets must exist in
    // the catalogue; arbitrary domain qualifiers must never be discarded to infer a match.
    private static readonly Dictionary<string, string> SkillAliases = new(StringComparer.OrdinalIgnoreCase)
    {
      { "Python (Programming Language)", "Python" },
      { "JavaScript (Programming Language)", "JavaScript" },
      { "SQL (Programming Language)", "SQL" },
      { "Git (Version Control System)", "Git" },
      { "Django (Web Framework)", "Django" },
      { "Cascading Style Sheets (CSS)", "CSS" }
    };
    #endregion

    #region Constructor
    public SkillService(ILogger<SkillService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IMemoryCache memoryCache,
        ILaborMarketProviderClientFactory laborMarketProviderClientFactory,
        SkillSearchFilterValidator searchFilterValidator,
        IRepositoryBatchedValueContains<Skill> skillRepository,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _memoryCache = memoryCache;
      _laborMarketProviderClient = laborMarketProviderClientFactory.CreateClient();
      _searchFilterValidator = searchFilterValidator;
      _skillRepository = skillRepository;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public Skill GetByName(string name)
    {
      var result = GetByNameOrNull(name);

      return result ?? throw new ArgumentException($"{nameof(Skill)} with name '{name}' does not exists", nameof(name));
    }

    public Skill? GetByNameOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      return List().SingleOrDefault(o => string.Equals(o.Name, name, StringComparison.OrdinalIgnoreCase));
    }

    public Skill? GetByNameNormalizedOrNull(string name)
    {
      if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentNullException(nameof(name));
      name = name.Trim();

      var lookup = GetLookupByNormalizedName();

      // Prefer the full name before considering lossy formatting or taxonomy aliases.
      if (lookup.ExactNames.TryGetValue(name, out var exact)) return exact;
      var normalized = NormalizeLookupKey(name);
      if (normalized == null) return null;
      if (lookup.NormalizedNames.TryGetValue(normalized, out var fullName)) return fullName;

      Skill? result = null;
      foreach (var key in GetLookupKeys(name))
      {
        if (!lookup.Aliases.TryGetValue(key, out var candidate)) continue;
        if (candidate == null || (result != null && result.Id != candidate.Id)) return null;
        result = candidate;
      }

      return result;
    }

    public Skill GetById(Guid id)
    {
      var result = GetByIdOrNull(id);

      return result ?? throw new ArgumentException($"{nameof(Skill)} with '{id}' does not exists", nameof(id));
    }

    public Skill? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return List().SingleOrDefault(o => o.Id == id);
    }

    public List<Skill> Contains(string value)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      return [.. List().Where(o => o.Name.Contains(value, StringComparison.OrdinalIgnoreCase))];
    }

    public SkillSearchResults Search(SkillSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _searchFilterValidator.ValidateAndThrow(filter);

      var query = List().AsEnumerable();

      if (!string.IsNullOrEmpty(filter.NameContains))
        query = query.Where(o => o.Name.Contains(filter.NameContains, StringComparison.OrdinalIgnoreCase));

      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      var results = new SkillSearchResults();

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Page(filter);
      }

      results.Items = [.. query];

      return results;
    }

    public async Task SeedSkills(bool onStartupInitialSeeding)
    {
      const string lockIdentifier = "skill_seed";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;
      var cacheClearRequired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (onStartupInitialSeeding && _skillRepository.Query().Any())
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Seeding (On Startup) of skills skipped");
          return;
        }

        var incomingResults = await _laborMarketProviderClient.ListSkills();
        if (incomingResults == null || incomingResults.Count == 0) return;

        int batchSize = _scheduleJobOptions.SeedSkillsBatchSize;
        int pageIndex = 0;
        do
        {
          var incomingBatch = incomingResults.Skip(pageIndex * batchSize).Take(batchSize).ToList();
          var incomingBatchExternalIds = incomingBatch.Select(o => o.Id).ToList();

          var existingItems = _skillRepository.Query().Where(o => incomingBatchExternalIds.Contains(o.ExternalId)).ToList();
          var existingByExternalId = existingItems.ToDictionary(o => o.ExternalId, StringComparer.Ordinal);

          var newItems = new List<Skill>();
          var updatedItems = new List<Skill>();

          foreach (var item in incomingBatch)
          {
            if (existingByExternalId.TryGetValue(item.Id, out var existItem))
            {
              var changed = false;

              if (!string.Equals(existItem.Name, item.Name, StringComparison.OrdinalIgnoreCase))
              {
                existItem.Name = item.Name;
                changed = true;
              }

              if (!string.Equals(existItem.InfoURL, item.InfoURL, StringComparison.Ordinal))
              {
                existItem.InfoURL = item.InfoURL;
                changed = true;
              }

              if (changed) updatedItems.Add(existItem);
            }
            else
            {
              newItems.Add(new Skill
              {
                Name = item.Name,
                InfoURL = item.InfoURL,
                ExternalId = item.Id
              });
            }
          }

          if (newItems.Count != 0)
          {
            await _skillRepository.Create(newItems);
            cacheClearRequired = true;
          }

          if (updatedItems.Count != 0)
          {
            await _skillRepository.Update(updatedItems);
            cacheClearRequired = true;
          }

          pageIndex++;
        }
        while (pageIndex * batchSize < incomingResults.Count);
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(SeedSkills), ex.Message);
      }
      finally
      {
        if (cacheClearRequired &&
          _appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        {
          _memoryCache.Remove(CacheHelper.GenerateKey<Skill>());
          _memoryCache.Remove(CacheHelper.GenerateKey<Skill>("normalized"));
        }

        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private List<Skill> List()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return [.. _skillRepository.Query().OrderBy(o => o.Name).ThenBy(o => o.Id)];

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Skill>(), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        return _skillRepository.Query()
          .OrderBy(o => o.Name)
          .ThenBy(o => o.Id)
          .ToList();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(Skill)}s'");

      return result;
    }

    private SkillNameLookup GetLookupByNormalizedName()
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return BuildLookupByNormalizedName();

      var result = _memoryCache.GetOrCreate(CacheHelper.GenerateKey<Skill>("normalized"), entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);

        return BuildLookupByNormalizedName();
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached normalized lookup of '{nameof(Skill)}s'");

      return result;
    }

    private SkillNameLookup BuildLookupByNormalizedName()
    {
      var result = new SkillNameLookup();

      foreach (var skill in List())
      {
        AddSkillLookup(result.ExactNames, skill.Name.Trim(), skill);
        var normalized = NormalizeLookupKey(skill.Name);
        if (normalized != null) AddSkillLookup(result.NormalizedNames, normalized, skill);

        // Qualifiers carry meaning: uniqueness alone cannot justify Programming -> Programming (Music).
        // Generate formatting aliases from the full name only; never discard or extract qualifiers.
        foreach (var key in GetLookupKeys(skill.Name))
          AddSkillLookup(result.Aliases, key, skill);

        if (SkillAliases.TryGetValue(skill.Name.Trim(), out var alias))
          foreach (var key in GetLookupKeys(alias))
            AddSkillLookup(result.Aliases, key, skill);
      }

      return result;
    }

    private sealed class SkillNameLookup
    {
      public Dictionary<string, Skill?> ExactNames { get; } = new(StringComparer.OrdinalIgnoreCase);
      public Dictionary<string, Skill?> NormalizedNames { get; } = new(StringComparer.OrdinalIgnoreCase);
      public Dictionary<string, Skill?> Aliases { get; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private static void AddSkillLookup(Dictionary<string, Skill?> lookup, string key, Skill skill)
    {
      // Null preserves ambiguity, independently of repository order or later candidates.
      if (!lookup.TryAdd(key, skill) && lookup[key]?.Id != skill.Id) lookup[key] = null;
    }

    private static IEnumerable<string> GetLookupKeys(string? value)
    {
      var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

      var normalized = NormalizeLookupKey(value);
      if (normalized == null) yield break;

      AddLookupKey(result, normalized);
      var withoutConnectorWords = RemoveConnectorWords(normalized);
      if (withoutConnectorWords != null) AddLookupKey(result, withoutConnectorWords);

      foreach (var key in result)
        yield return key;
    }

    private static void AddLookupKey(HashSet<string> result, string value)
    {
      value = value.NormalizeNullableValue()!;
      result.Add(value);

      var compact = value.RemoveWhiteSpaces();
      if (!compact.EqualsOrdinalIgnoreCase(value))
        result.Add(compact);
    }

    private static string? RemoveConnectorWords(string value)
    {
      var result = value
        .Replace(" and ", " ", StringComparison.OrdinalIgnoreCase)
        .NormalizeTrim()
        .NormalizeNullableValue();

      return result != null && !result.EqualsOrdinalIgnoreCase(value)
        ? result
        : null;
    }

    private static string? NormalizeLookupKey(string? value)
    {
      if (string.IsNullOrWhiteSpace(value)) return null;

      value = WebUtility.HtmlDecode(value).NormalizeTrim();

      value = value
        .Replace("&", " and ", StringComparison.Ordinal)
        .Replace("+", " plus ", StringComparison.Ordinal)
        .Replace("#", " sharp ", StringComparison.Ordinal)
        .Replace("/", " ", StringComparison.Ordinal)
        .Replace("\\", " ", StringComparison.Ordinal)
        .Replace("-", " ", StringComparison.Ordinal)
        .Replace("_", " ", StringComparison.Ordinal)
        .Replace(".", " ", StringComparison.Ordinal)
        .ToLowerInvariant();

      value = value.RemoveSpecialCharacters();
      value = value.NormalizeTrim();

      return value.NormalizeNullableValue();
    }
    #endregion
  }
}
