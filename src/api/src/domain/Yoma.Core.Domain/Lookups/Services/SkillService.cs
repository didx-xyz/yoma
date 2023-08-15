using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.LaborMarketProvider.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Domain.Lookups.Services
{
  public class SkillService : ISkillService
  {
    #region Class Variables
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly ILaborMarketProviderClient _laborMarketProviderClient;
    private readonly IRepositoryBatched<Skill> _skillRepository;
    #endregion

    #region Constructor
    public SkillService(IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IMemoryCache memoryCache,
        ILaborMarketProviderClientFactory laborMarketProviderClientFactory,
        IRepositoryBatched<Skill> skillRepository)
    {
      _scheduleJobOptions = scheduleJobOptions.Value;
      _laborMarketProviderClient = laborMarketProviderClientFactory.CreateClient();
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

      return _skillRepository.Query().SingleOrDefault(o => o.Name == name);
    }

    public Skill GetById(Guid id)
    {
      var result = GetByIdOrNull(id);

      return result ?? throw new ArgumentException($"{nameof(Skill)} for '{id}' does not exists", nameof(id));
    }

    public Skill? GetByIdOrNull(Guid id)
    {
      if (id == Guid.Empty)
        throw new ArgumentNullException(nameof(id));

      return _skillRepository.Query().SingleOrDefault(o => o.Id == id);
    }

    public SkillSearchResults Search(SkillSearchFilter filter)
    {
      if (filter == null)
        throw new ArgumentNullException(nameof(filter));

      filter.EnsurePagination();

      var query = _skillRepository.Query();
      if (!string.IsNullOrEmpty(filter.NameContains))
        query = query.Where(o => o.Name.Contains(filter.NameContains));

      query = query.OrderBy(o => o.Name);

      var result = new SkillSearchResults
      {
        TotalCount = query.Count()
      };

      query = query.Skip((filter.PageNumber.Value - 1) * filter.PageSize.Value).Take(filter.PageSize.Value);
      result.Items = query.ToList();

      return result;
    }

    public async Task SeedSkills()
    {
      var incomingResults = await _laborMarketProviderClient.ListSkills();
      if (incomingResults == null || !incomingResults.Any()) return;

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

        if (newItems.Any()) await _skillRepository.Create(newItems);
        if (existingItems.Any()) await _skillRepository.Update(existingItems);

        pageIndex++;
      }
      while ((pageIndex - 1) * batchSize < incomingResults.Count);
    }
    #endregion
  }
}
