using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Infrastructure.Alison.Interfaces;
using Yoma.Core.Infrastructure.Alison.Models;

namespace Yoma.Core.Infrastructure.Alison.Services
{
  public sealed class OpportunityCatalogueBackgroundService : IOpportunityCatalogueBackgroundService
  {
    #region Class Variables
    private readonly ILogger<OpportunityCatalogueBackgroundService> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly AlisonOptions _options;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly IAlisonAuthService _alisonAuthService;
    #endregion

    #region Constructor
    public OpportunityCatalogueBackgroundService(
      ILogger<OpportunityCatalogueBackgroundService> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<AlisonOptions> options,
      IOptions<AppSettings> appSettings,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IRepositoryBatched<Opportunity> opportunityRepository,
      IDistributedLockService distributedLockService,
      IExecutionStrategyService executionStrategyService,
      IAlisonAuthService alisonAuthService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
      _alisonAuthService = alisonAuthService ?? throw new ArgumentNullException(nameof(alisonAuthService));
    }
    #endregion

    #region Public Members
    public async Task RefreshCatalogue(bool onStartupInitialRefresh)
    {
      const string lockIdentifier = "alison_opportunity_catalogue_refresh";

      var maxIntervalInHours = _options.PollScheduleMaxIntervalInHours > default(int)
        ? _options.PollScheduleMaxIntervalInHours
        : _scheduleJobOptions.DefaultScheduleMaxIntervalInHours;

      var lockDuration = TimeSpan.FromHours(maxIntervalInHours)
        + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        var syncFromExternalPartners = _appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment);

        // Startup refresh is only intended to seed local embedded sample data.
        // Do not trigger the live pull on application startup.
        if (onStartupInitialRefresh && syncFromExternalPartners)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Refreshing (On Startup) of Alison opportunity catalogue skipped because external partner synchronization is enabled for environment '{environment}'", _environmentProvider.Environment);

          return;
        }

        if (onStartupInitialRefresh && _opportunityRepository.Query().Any())
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Refreshing (On Startup) of Alison opportunity catalogue skipped because local cache already contains data");

          return;
        }

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processing Alison opportunity catalogue refresh");

        var now = DateTimeOffset.UtcNow;

        if (syncFromExternalPartners)
          await RefreshFromApiAsync(now);
        else
          await RefreshFromFileAsync(now);

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processed Alison opportunity catalogue refresh");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(RefreshCatalogue), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private async Task RefreshFromFileAsync(DateTimeOffset now)
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using local .NET embedded Alison course catalogue resource. No external API request will be performed");

      var courses = LoadEmbeddedCourses();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        await ProcessOpportunities(courses, now);

        scope.Complete();
      });

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("File-mode Alison opportunity catalogue refresh complete");
    }

    private async Task RefreshFromApiAsync(DateTimeOffset now)
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using Alison API. Full course catalogue will be retrieved before local cache processing");

      var courses = await GetCourses();

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        await ProcessOpportunities(courses, now);

        scope.Complete();
      });

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("HTTP Alison opportunity catalogue refresh complete");
    }

    private List<Course> LoadEmbeddedCourses()
    {
      if (string.IsNullOrWhiteSpace(_options.CourseCatalogueEmbeddedResourceName))
        throw new InvalidOperationException("Alison embedded resource name is required");

      var assembly = typeof(OpportunityCatalogueBackgroundService).Assembly;
      var assemblyName = assembly.GetName().Name;

      var resourceName = $"{assemblyName}.{_options.CourseCatalogueEmbeddedResourceName.Trim()}";

      using var resourceStream = assembly.GetManifestResourceStream(resourceName)
        ?? throw new InvalidOperationException($"Embedded Alison sample resource '{resourceName}' not found. Ensure file is added to the project, marked as Embedded Resource, and compiled into the assembly");

      using var reader = new StreamReader(resourceStream);
      var json = reader.ReadToEnd();

      var response = JsonConvert.DeserializeObject<Response<Course>>(json)
        ?? throw new InvalidOperationException("Failed to deserialize embedded Alison sample courses JSON");

      return response.Data;
    }

    private async Task<List<Course>> GetCourses()
    {
      var pageNumber = 1;
      var courses = new List<Course>();
      int? total = null;

      while (true)
      {
        var response = await GetCoursesPage(pageNumber, Constants.PageSize_Maximum);

        total ??= response.Total;

        if (!total.HasValue)
          throw new InvalidOperationException("Alison course response did not contain pagination total");

        courses.AddRange(response.Data);

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation(
            "Loaded Alison courses page '{page}' with '{count}' items. Total loaded '{totalLoaded}' of '{total}'",
            pageNumber, response.Data.Count, courses.Count, total.Value);

        if (response.Data.Count < Constants.PageSize_Maximum)
          break;

        if (courses.Count >= total.Value)
          break;

        pageNumber++;
      }

      return courses;
    }

    private async Task<Response<Course>> GetCoursesPage(int pageNumber, int pageSize)
    {
      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Requesting Alison courses from '{path}' with page '{page}' and perPage '{perPage}'",
          _options.CoursesPath, pageNumber, pageSize);

      return await _options.BaseUrl
        .AppendPathSegment(_options.CoursesPath)
        .SetQueryParam(Constants.QueryParameter_Page, pageNumber)
        .SetQueryParam(Constants.QueryParameter_PerPage, pageSize)
        .WithAuthHeader(await _alisonAuthService.GetAuthHeader())
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .GetAsync()
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<Response<Course>>();
    }

    private async Task ProcessOpportunities(List<Course> courses, DateTimeOffset now)
    {
      ArgumentNullException.ThrowIfNull(courses, nameof(courses));

      if (courses.Count == 0)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("Alison course catalogue returned no courses. Skipping processing to avoid marking existing items as deleted");

        return;
      }

      var itemsNormalizedRaw = courses
        .Where(o => o.Id > 0)
        .Select(ToOpportunity)
        .GroupBy(o => o.ExternalId, StringComparer.Ordinal)
        .Select(g => g.First())
        .ToList();

      if (itemsNormalizedRaw.Count == 0)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("Alison course catalogue produced no valid course records. Skipping processing to avoid marking existing items as deleted");

        return;
      }

      var incomingExternalIds = itemsNormalizedRaw
        .Select(o => o.ExternalId)
        .ToHashSet(StringComparer.Ordinal);

      var itemsExisting = _opportunityRepository.Query()
        .ToList()
        .ToDictionary(o => o.ExternalId, StringComparer.Ordinal);

      var itemsToCreate = new List<Opportunity>();
      var itemsToUpdate = new List<Opportunity>();
      var itemsToMarkDeleted = new List<Opportunity>();

      foreach (var item in itemsNormalizedRaw)
      {
        if (!itemsExisting.TryGetValue(item.ExternalId, out var itemExisting))
        {
          itemsToCreate.Add(new Opportunity
          {
            ExternalId = item.ExternalId,
            PayloadHash = item.PayloadHash,
            PayloadJson = item.PayloadJson,
            Deleted = false,
            DateCreated = now,
            DateModified = now
          });

          continue;
        }

        // Deleted is terminal. If an item was already marked as deleted, do not reactivate or update it,
        // even if it appears in the catalogue again.
        if (itemExisting.Deleted == true)
          continue;

        if (string.Equals(itemExisting.PayloadHash, item.PayloadHash, StringComparison.Ordinal))
          continue;

        itemExisting.PayloadHash = item.PayloadHash;
        itemExisting.PayloadJson = item.PayloadJson;
        itemExisting.DateModified = now;
        itemsToUpdate.Add(itemExisting);
      }

      // Alison removals are derived from absence in the full course catalogue.
      // If a previously seen item is missing from the latest successful non-empty full catalogue,
      // treat it as removed/unpublished locally.
      // Deleted is terminal and must not be reversed if the item later reappears.
      var itemsMissingFromCatalogue = itemsExisting.Values
        .Where(o => !incomingExternalIds.Contains(o.ExternalId) && o.Deleted != true)
        .ToList();

      foreach (var item in itemsMissingFromCatalogue)
      {
        item.Deleted = true;
        item.DateModified = now;
        itemsToMarkDeleted.Add(item);
      }

      if (itemsToCreate.Count > 0)
        await _opportunityRepository.Create(itemsToCreate);

      var itemsToPersistUpdate = itemsToUpdate
        .Concat(itemsToMarkDeleted)
        .ToList();

      if (itemsToPersistUpdate.Count > 0)
        await _opportunityRepository.Update(itemsToPersistUpdate);

      // Retention: -1 means keep deleted rows indefinitely.
      var deletedCount = default(int);
      if (_options.RetentionDays >= default(int))
      {
        var cutoffUtc = now.AddDays(-_options.RetentionDays);

        var itemsStale = _opportunityRepository.Query()
          .Where(o => o.Deleted == true && o.DateModified < cutoffUtc)
          .ToList();

        if (itemsStale.Count > 0)
        {
          await _opportunityRepository.Delete(itemsStale);
          deletedCount = itemsStale.Count;
        }
      }

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Alison course catalogue sync summary: Created={Created}, Updated={Updated}, MarkedDeleted={MarkedDeleted}, Purged={Purged}",
          itemsToCreate.Count, itemsToUpdate.Count, itemsToMarkDeleted.Count, deletedCount);
    }

    private static Opportunity ToOpportunity(Course course)
    {
      ArgumentNullException.ThrowIfNull(course, nameof(course));

      var payloadJson = HashHelper.SerializeForHashing(course);

      return new Opportunity
      {
        ExternalId = course.Id.ToString(),
        PayloadHash = HashHelper.ComputeSHA256Hash(payloadJson),
        PayloadJson = payloadJson,
        Deleted = false
      };
    }
    #endregion
  }
}
