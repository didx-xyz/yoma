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

    private static readonly object _lock_Object = new();
    #endregion

    #region Constructor
    public SkillService(ILogger<SkillService> logger,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        ILaborMarketProviderClientFactory laborMarketProviderClientFactory,
        SkillSearchFilterValidator searchFilterValidator,
        IRepositoryBatchedValueContains<Skill> skillRepository)
    {
      _logger = logger;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _laborMarketProviderClient = laborMarketProviderClientFactory.CreateClient();
      _searchFilterValidator = searchFilterValidator;
      _skillRepository = skillRepository;
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

      return _skillRepository.Query().SingleOrDefault(o => o.Name.ToLower() == name.ToLower());
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
      ArgumentNullException.ThrowIfNull(filter);

      _searchFilterValidator.ValidateAndThrow(filter);

      var query = _skillRepository.Query();
      if (!string.IsNullOrEmpty(filter.NameContains))
        query = _skillRepository.Contains(query, filter.NameContains);

      var results = new SkillSearchResults();
      query = query.OrderBy(o => o.Name);

      if (filter.PaginationEnabled)
      {
        results.TotalCount = query.Count();
        query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      }
      results.Items = [.. query];

      return results;
    }

    public void SeedSkills()
    {
      lock (_lock_Object) //ensure single thread execution at a time; avoid processing the same on multiple threads
      {
        try
        {
          var incomingResults = _laborMarketProviderClient.ListSkills().Result;
          if (incomingResults == null || incomingResults.Count == 0) return;

          int batchSize = _scheduleJobOptions.SeedSkillsBatchSize;
          int pageIndex = 0;
          do
          {
            var incomingBatch = incomingResults.Skip(pageIndex * batchSize).Take(batchSize).ToList();
            var incomingBatchIds = incomingBatch.Select(o => o.Id).ToList();
            var existingItems = _skillRepository.Query().Where(o => incomingBatchIds.Contains(o.ExternalId)).ToList();
            var newItems = new List<Skill>();
            foreach (var item in incomingBatch)
            {
              var existItem = existingItems.SingleOrDefault(o => o.ExternalId == item.Id);
              if (existItem != null)
              {
                existItem.Name = item.Name;
                existItem.InfoURL = item.InfoURL;
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

            if (newItems.Count != 0) _skillRepository.Create(newItems).Wait();
            if (existingItems.Count != 0) _skillRepository.Update(existingItems).Wait();

            pageIndex++;
          }
          while ((pageIndex - 1) * batchSize < incomingResults.Count);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Failed to seed labor market skills");
        }
      }
    }
    #endregion
  }
}
