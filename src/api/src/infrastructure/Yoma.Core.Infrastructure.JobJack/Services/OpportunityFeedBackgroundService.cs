using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Transactions;
using System.Xml.Linq;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Opportunity.Services;
using Yoma.Core.Infrastructure.JobJack.Interfaces;
using Yoma.Core.Infrastructure.JobJack.Models;

namespace Yoma.Core.Infrastructure.JobJack.Services
{
  public sealed class OpportunityFeedBackgroundService : IOpportunityFeedBackgroundService
  {
    #region Class Variables
    private readonly ILogger<OpportunityFeedBackgroundService> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly JobJackOptions _options;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly IRepository<FeedSyncTracking> _feedSyncTrackingRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;
    #endregion

    #region Constructor
    public OpportunityFeedBackgroundService(
      ILogger<OpportunityFeedBackgroundService> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<JobJackOptions> options,
      IOptions<AppSettings> appSettings,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IHttpClientFactory httpClientFactory,
      IRepositoryBatched<Opportunity> opportunityRepository,
      IRepository<FeedSyncTracking> feedSyncTrackingRepository,
      IDistributedLockService distributedLockService,
      IExecutionStrategyService executionStrategyService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));
      _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _feedSyncTrackingRepository = feedSyncTrackingRepository ?? throw new ArgumentNullException(nameof(feedSyncTrackingRepository));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members
    public async Task RefreshFeed(bool onStartupInitialRefresh)
    {
      const string lockIdentifier = "jobjack_opportunity_feed_refresh";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours)
        + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        var syncFromExternalPartners = _appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment);

        // Startup refresh is only intended to seed local embedded sample data.
        // Do not trigger the live XML pull on application startup.
        if (onStartupInitialRefresh && syncFromExternalPartners)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Refreshing (On Startup) of JobJack opportunity feed skipped because external partner synchronization is enabled for environment '{environment}'", _environmentProvider.Environment);

          return;
        }

        if (onStartupInitialRefresh && _opportunityRepository.Query().Any())
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Refreshing (On Startup) of JobJack opportunity feed skipped because local cache already contains data");

          return;
        }

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processing JobJack opportunity feed refresh");

        var now = DateTimeOffset.UtcNow;

        if (syncFromExternalPartners)
          await RefreshFromXMLFeedAsync(now);
        else
          await RefreshFromFileAsync(now);

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processed JobJack opportunity feed refresh");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(RefreshFeed), ex.Message);
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
        _logger.LogInformation("Using local .NET embedded JobJack XML resource. No feed state tracking will be performed");

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("File-mode JobJack sync start");

      var xmlDoc = ParseLocalFeed(_options);

      var opportunities = ParseOpportunities(xmlDoc);

      await ProcessOpportunities(opportunities, now);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("File-mode JobJack sync complete");
    }

    private async Task RefreshFromXMLFeedAsync(DateTimeOffset now)
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using JobJack XML feed. Feed state tracking will be updated. Conditional requests enabled: {UseConditionalRequests}", _options.UseConditionalRequests);

      var client = _httpClientFactory.CreateClient(nameof(OpportunityFeedBackgroundService));
      client.Timeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds);

      if (!string.IsNullOrWhiteSpace(_options.UserAgent))
        client.DefaultRequestHeaders.UserAgent.ParseAdd(_options.UserAgent);

      if (string.IsNullOrWhiteSpace(_options.FeedUrl))
        throw new InvalidOperationException("JobJack feed URL is required");

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("HTTP JobJack sync start");

      var tracking = _feedSyncTrackingRepository.Query().SingleOrDefault();
      var isNewTracking = tracking is null;
      tracking ??= new FeedSyncTracking();

      // Always bypass CDN/cache variants with a cache-buster.
      // The feed is treated as a complete snapshot and each successful refresh must process the full feed
      // to detect opportunities missing from the latest feed.
      var freshUrl = Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(_options.FeedUrl, "cb", now.ToString("yyyyMMddHHmmss"));

      using var resp = await HttpHelper.SendWithRetryAsync(
        client,
        requestFactory: () =>
        {
          var req = new HttpRequestMessage(HttpMethod.Get, freshUrl);

          req.Headers.TryAddWithoutValidation("Accept", "application/xml, text/xml;q=0.9, */*;q=0.5");
          req.Headers.TryAddWithoutValidation("Accept-Language", "en");
          req.Headers.TryAddWithoutValidation("Cache-Control", "no-cache");
          req.Headers.TryAddWithoutValidation("Pragma", "no-cache");

          // Conditional headers are disabled by default because the JobJack feed is treated as a complete snapshot.
          // If enabled, a 304 response skips parsing and therefore skips missing-item deletion detection for that run.
          if (_options.UseConditionalRequests && !isNewTracking)
          {
            if (!string.IsNullOrEmpty(tracking.ETag) && EntityTagHeaderValue.TryParse(tracking.ETag, out var etag))
              req.Headers.IfNoneMatch.Add(etag);

            if (tracking.FeedLastModified.HasValue)
              req.Headers.IfModifiedSince = tracking.FeedLastModified.Value.UtcDateTime;
          }

          return req;
        },
        logger: _logger);

      if (resp.StatusCode == System.Net.HttpStatusCode.NotModified)
      {
        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("HTTP JobJack sync 304 Not Modified");

        return;
      }

      resp.EnsureSuccessStatusCode();

      await using var stream = await resp.Content.ReadAsStreamAsync();
      var doc = XMLHelper.Load(stream);

      var opportunities = ParseOpportunities(doc);

      await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
      {
        using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

        await ProcessOpportunities(opportunities, now);

        tracking.ETag = resp.Headers.ETag?.ToString();
        tracking.FeedLastModified = resp.Content.Headers.LastModified;
        tracking.DateModified = now;

        if (isNewTracking)
        {
          tracking.DateCreated = now;
          await _feedSyncTrackingRepository.Create(tracking);
        }
        else
        {
          await _feedSyncTrackingRepository.Update(tracking);
        }

        scope.Complete();
      });

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("HTTP JobJack sync complete");
    }

    private static XDocument ParseLocalFeed(JobJackOptions options)
    {
      ArgumentNullException.ThrowIfNull(options, nameof(options));

      if (string.IsNullOrWhiteSpace(options.EmbeddedResourceName))
        throw new ArgumentNullException(nameof(options), "Embedded resource name is required");

      var assembly = typeof(OpportunityFeedBackgroundService).Assembly;
      var assemblyName = assembly.GetName().Name;

      var resourceName = $"{assemblyName}.{options.EmbeddedResourceName.Trim()}";

      using var resourceStream = assembly.GetManifestResourceStream(resourceName)
        ?? throw new InvalidOperationException($"Embedded resource '{resourceName}' not found. Ensure file is added to the project, marked as Embedded Resource, and compiled into the assembly");

      return XMLHelper.Load(resourceStream);
    }

    private static List<Opportunity> ParseOpportunities(XDocument doc)
    {
      ArgumentNullException.ThrowIfNull(doc, nameof(doc));

      var items = doc.Root?.Elements("opportunity") ?? [];
      var opportunities = new List<Opportunity>();

      foreach (var x in items)
      {
        var externalId = x.GetElementText("unique_reference");
        var title = x.GetElementText("job_title");

        // Skip malformed items: must have stable external id and title.
        if (string.IsNullOrEmpty(externalId) || string.IsNullOrEmpty(title))
          continue;

        var dateStart = x.TryGetElementDate("date_recieved", out var dateStartParsed)
          ? dateStartParsed
          : default(DateTimeOffset?);

        var dateEnd = x.TryGetElementDate("closing_date", out var dateEndParsed)
          ? dateEndParsed
          : default(DateTimeOffset?);

        var employmentStartDate = x.TryGetElementDate("employment_start_date", out var employmentStartDateParsed)
          ? employmentStartDateParsed
          : default(DateTimeOffset?);

        var opportunitiesAvailable = x.TryGetElementInt("number_of_opportunities_available", out var opportunitiesAvailableParsed)
          ? opportunitiesAvailableParsed
          : default(int?);

        var salaryLow = x.TryGetElementDecimal("salary_low", out var salaryLowParsed) && salaryLowParsed > default(decimal)
          ? salaryLowParsed
          : default(decimal?);

        var salaryHigh = x.TryGetElementDecimal("salary_high", out var salaryHighParsed) && salaryHighParsed > default(decimal)
          ? salaryHighParsed
          : default(decimal?);

        opportunities.Add(new Opportunity
        {
          ExternalId = externalId,
          Title = title,
          Company = GetOptionalElementText(x, "company"),
          Description = GetOptionalElementContent(x, "role_description"),
          Requirements = GetOptionalElementContent(x, "role_requirements"),
          Location = GetOptionalElementText(x, "location"),
          City = GetOptionalElementText(x, "city"),
          Province = GetOptionalElementText(x, "province"),
          ContractType = GetOptionalElementText(x, "contract_type"),
          OpportunitiesAvailable = opportunitiesAvailable,
          URL = GetOptionalElementText(x, "url"),
          SalaryLow = salaryLow,
          SalaryHigh = salaryHigh,
          SalaryFrequency = GetOptionalElementText(x, "salary_frequency"),
          SalaryType = GetOptionalElementText(x, "salary_type"),
          SalaryAdditional = GetOptionalElementText(x, "salary_additional"),
          Duration = GetOptionalElementText(x, "duration"),
          DateStart = dateStart,
          DateEnd = dateEnd,
          EmploymentStartDate = employmentStartDate,
          Category = GetOptionalElementText(x, "industry_sector"),

          // JobJack confirmed removal is derived from absence in the full snapshot.
          // Items present in the latest successful feed are not deleted.
          Deleted = false
        });
      }

      return opportunities;
    }

    private async Task ProcessOpportunities(List<Opportunity> opportunities, DateTimeOffset now)
    {
      ArgumentNullException.ThrowIfNull(opportunities, nameof(opportunities));

      if (opportunities.Count == 0)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("JobJack feed returned no opportunities. Skipping processing to avoid marking existing items as deleted");

        return;
      }

      // Deduplicate incoming rows by ExternalId first.
      // ExternalId is the stable provider identity used by the JobJack cache table.
      var itemsNormalizedRaw = opportunities
        .GroupBy(o => o.ExternalId, StringComparer.Ordinal)
        .Select(g => g.First())
        .ToList();

      // Normalize and cap titles before persisting so the cached value matches the value sent to Yoma.
      itemsNormalizedRaw.ForEach(o => o.Title = NormalizeTitle(o.Title));
      itemsNormalizedRaw = [.. itemsNormalizedRaw.Where(o => !string.IsNullOrWhiteSpace(o.Title))];

      if (itemsNormalizedRaw.Count == 0)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("JobJack feed returned no valid opportunities after title normalization. Skipping processing to avoid marking existing items as deleted");

        return;
      }

      // Match the domain sync listing order for deterministic processing.
      itemsNormalizedRaw = [.. itemsNormalizedRaw.OrderBy(o => o.ExternalId)];

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
          item.DateStart ??= now;
          item.DateCreated = now;
          item.DateModified = now;
          itemsToCreate.Add(item);
          continue;
        }

        // Deleted is terminal. If an item was already marked as deleted, do not reactivate or update it,
        // even if it appears in the feed again.
        if (itemExisting.Deleted == true)
          continue;

        // If the source omits DateStart, keep the stable default captured when the row was first created.
        item.DateStart ??= itemExisting.DateStart;

        if (Equivalent(itemExisting, item))
          continue;

        CopyMutable(item, itemExisting);
        itemExisting.DateModified = now;
        itemsToUpdate.Add(itemExisting);
      }

      // JobJack confirmed the XML feed is a complete current snapshot.
      // If a previously seen item is missing from the latest successful non-empty feed,
      // treat it as removed/expired locally. Deleted is terminal if the item later reappears.
      var itemsMissingFromFeed = itemsExisting.Values
        .Where(o => !incomingExternalIds.Contains(o.ExternalId) && o.Deleted != true)
        .ToList();

      foreach (var item in itemsMissingFromFeed)
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
          "JobJack feed sync summary: Created={Created}, Updated={Updated}, MarkedDeleted={MarkedDeleted}, Purged={Purged}",
          itemsToCreate.Count, itemsToUpdate.Count, itemsToMarkDeleted.Count, deletedCount);
    }

    private static string NormalizeTitle(string? title)
    {
      title = title?.NormalizeTrimMultiline();

      return string.IsNullOrWhiteSpace(title)
        ? string.Empty
        : title.TrimToLengthWithEllipsis(OpportunityService.Title_MaxLength);
    }

    private static string? GetOptionalElementText(XContainer container, XName name)
    {
      return NormalizeOptionalValue(container.GetElementText(name));
    }

    private static string? GetOptionalElementContent(XContainer container, XName name)
    {
      return NormalizeOptionalValue(container.GetElementContent(name));
    }

    private static string? NormalizeOptionalValue(string? value)
    {
      return string.Equals(value, "Unspecified", StringComparison.OrdinalIgnoreCase) ? null : value;
    }

    private static bool Equivalent(Opportunity itemExisting, Opportunity item) =>
      string.Equals(itemExisting.Title, item.Title, StringComparison.OrdinalIgnoreCase) &&
      string.Equals(itemExisting.Company, item.Company, StringComparison.Ordinal) &&
      string.Equals(itemExisting.Description, item.Description, StringComparison.Ordinal) &&
      string.Equals(itemExisting.Requirements, item.Requirements, StringComparison.Ordinal) &&
      string.Equals(itemExisting.Location, item.Location, StringComparison.Ordinal) &&
      string.Equals(itemExisting.City, item.City, StringComparison.Ordinal) &&
      string.Equals(itemExisting.Province, item.Province, StringComparison.Ordinal) &&
      string.Equals(itemExisting.ContractType, item.ContractType, StringComparison.Ordinal) &&
      itemExisting.OpportunitiesAvailable == item.OpportunitiesAvailable &&
      string.Equals(itemExisting.URL, item.URL, StringComparison.Ordinal) &&
      itemExisting.SalaryLow == item.SalaryLow &&
      itemExisting.SalaryHigh == item.SalaryHigh &&
      string.Equals(itemExisting.SalaryFrequency, item.SalaryFrequency, StringComparison.Ordinal) &&
      string.Equals(itemExisting.SalaryType, item.SalaryType, StringComparison.Ordinal) &&
      string.Equals(itemExisting.SalaryAdditional, item.SalaryAdditional, StringComparison.Ordinal) &&
      string.Equals(itemExisting.Duration, item.Duration, StringComparison.Ordinal) &&
      itemExisting.DateStart == item.DateStart &&
      itemExisting.DateEnd == item.DateEnd &&
      itemExisting.EmploymentStartDate == item.EmploymentStartDate &&
      string.Equals(itemExisting.Category, item.Category, StringComparison.Ordinal);

    private static void CopyMutable(Opportunity source, Opportunity target)
    {
      target.Title = source.Title;
      target.Company = source.Company;
      target.Description = source.Description;
      target.Requirements = source.Requirements;
      target.Location = source.Location;
      target.City = source.City;
      target.Province = source.Province;
      target.ContractType = source.ContractType;
      target.OpportunitiesAvailable = source.OpportunitiesAvailable;
      target.URL = source.URL;
      target.SalaryLow = source.SalaryLow;
      target.SalaryHigh = source.SalaryHigh;
      target.SalaryFrequency = source.SalaryFrequency;
      target.SalaryType = source.SalaryType;
      target.SalaryAdditional = source.SalaryAdditional;
      target.Duration = source.Duration;
      target.DateStart = source.DateStart;
      target.DateEnd = source.DateEnd;
      target.EmploymentStartDate = source.EmploymentStartDate;
      target.Category = source.Category;
    }
    #endregion
  }
}
