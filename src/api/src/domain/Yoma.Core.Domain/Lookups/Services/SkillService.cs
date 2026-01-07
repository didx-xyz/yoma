using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
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
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly ILaborMarketProviderClient _laborMarketProviderClient;
    private readonly SkillSearchFilterValidator _searchFilterValidator;
    private readonly IRepositoryBatchedValueContains<Skill> _skillRepository;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public SkillService(ILogger<SkillService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ILaborMarketProviderClientFactory laborMarketProviderClientFactory,
        SkillSearchFilterValidator searchFilterValidator,
        IRepositoryBatchedValueContains<Skill> skillRepository,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
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

#pragma warning disable CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
      return _skillRepository.Query().SingleOrDefault(o => o.Name.ToLower() == name.ToLower());
#pragma warning restore CA1862 // Use the 'StringComparison' method overloads to perform case-insensitive string comparisons
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

      return _skillRepository.Query().SingleOrDefault(o => o.Id == id);
    }

    public List<Skill> Contains(string value)
    {
      if (string.IsNullOrWhiteSpace(value))
        throw new ArgumentNullException(nameof(value));
      value = value.Trim();

      return [.. _skillRepository.Contains(_skillRepository.Query(), value)];
    }

    public SkillSearchResults Search(SkillSearchFilter filter)
    {
      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      _searchFilterValidator.ValidateAndThrow(filter);

      var query = _skillRepository.Query();
      if (!string.IsNullOrEmpty(filter.NameContains))
        query = _skillRepository.Contains(query, filter.NameContains);

      var results = new SkillSearchResults();
      query = query.OrderBy(o => o.Name).ThenBy(o => o.Id); //ensure deterministic sorting / consistent pagination results

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }
      results.Items = [.. query];

      return results;
    }

    public async Task SeedSkills(bool onStartupInitialSeeding)
    {
      const string lockIdentifier = "skill_seed";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

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

              if (!string.Equals(existItem.Name, item.Name, StringComparison.InvariantCultureIgnoreCase))
              { existItem.Name = item.Name; changed = true; }

              if (!string.Equals(existItem.InfoURL, item.InfoURL, StringComparison.Ordinal))
              { existItem.InfoURL = item.InfoURL; changed = true; }

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

          if (newItems.Count != 0) await _skillRepository.Create(newItems);
          if (updatedItems.Count != 0) await _skillRepository.Update(updatedItems);

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
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
