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
using Yoma.Core.Infrastructure.Jobberman.Interfaces;
using Yoma.Core.Infrastructure.Jobberman.Models;

namespace Yoma.Core.Infrastructure.Jobberman.Services
{
  public sealed class OpportunityFeedBackgroundService : IOpportunityFeedBackgroundService
  {
    #region Class Variables
    private readonly ILogger<OpportunityFeedBackgroundService> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly JobbermanOptions _options;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly IRepository<FeedSyncTracking> _feedSyncTrackingRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly ExecutionStrategyService _executionStrategyService;

    private static readonly XNamespace XNamespace_MediaNs = "http://search.yahoo.com/mrss/";
    #endregion

    #region Constructor
    public OpportunityFeedBackgroundService(
      ILogger<OpportunityFeedBackgroundService> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<JobbermanOptions> options,
      IOptions<AppSettings> appSettings,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IHttpClientFactory httpClientFactory,
      IRepositoryBatched<Opportunity> opportunityRepository,
      IRepository<FeedSyncTracking> feedSyncTrackingRepository,
      IDistributedLockService distributedLockService,
      ExecutionStrategyService executionStrategyService)
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
    public async Task RefreshFeeds(bool onStartupInitialRefresh)
    {
      const string lockIdentifier = "jobberman_opportunity_feed_refresh_feeds";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours)
        + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        var syncFromExternalPartners = _appSettings.PartnerSyncEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment);

        // Startup refresh is only intended to seed local embedded sample data.
        // Do not trigger the live RSS pull on application startup.
        if (onStartupInitialRefresh && syncFromExternalPartners)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Refreshing (On Startup) of Jobberman opportunity feeds skipped because external partner synchronization is enabled for environment '{environment}'", _environmentProvider.Environment);

          return;
        }

        if (onStartupInitialRefresh && _opportunityRepository.Query().Any())
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Refreshing (On Startup) of Jobberman opportunity feeds skipped because local cache already contains data");

          return;
        }

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processing Jobberman opportunity feed refresh");

        var now = DateTimeOffset.UtcNow;

        if (syncFromExternalPartners)
          await RefreshFromRSSFeedAsync(now);
        else
          await RefreshFromFileAsync(now);

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processed Jobberman opportunity feed refresh");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(RefreshFeeds), ex.Message);
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
        _logger.LogInformation("Using local .NET embedded Jobberman RSS resources. No feed state tracking will be performed");

      foreach (var feed in _options.Feeds)
      {
        try
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("File-mode Jobberman sync start: {CountryCodeAlpha2}", feed.CountryCodeAlpha2);

          var xmlDoc = ParseLocalFeed(feed);

          var opportunities = ParseOpportunities(feed, xmlDoc);

          await ProcessOpportunities(feed, opportunities, now);

          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("File-mode Jobberman sync complete: {CountryCodeAlpha2}", feed.CountryCodeAlpha2);
        }
        catch (Exception ex)
        {
          if (_logger.IsEnabled(LogLevel.Error))
            _logger.LogError(ex, "Error during file-mode Jobberman sync for country feed {CountryCodeAlpha2}", feed.CountryCodeAlpha2);
        }
      }
    }

    private async Task RefreshFromRSSFeedAsync(DateTimeOffset now)
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using Jobberman RSS feeds. Feed state tracking will be updated. Conditional requests enabled: {UseConditionalRequests}", _options.UseConditionalRequests);

      var client = _httpClientFactory.CreateClient(nameof(OpportunityFeedBackgroundService));
      client.Timeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds);

      if (!string.IsNullOrWhiteSpace(_options.UserAgent))
        client.DefaultRequestHeaders.UserAgent.ParseAdd(_options.UserAgent);

      foreach (var feed in _options.Feeds)
      {
        try
        {
          if (string.IsNullOrWhiteSpace(feed.CountryCodeAlpha2))
            throw new InvalidOperationException("Feed: Country code alpha 2 is required");

          if (string.IsNullOrWhiteSpace(feed.UrlSuffix))
            throw new InvalidOperationException("Feed: URL suffix is required");

          var countryCodeAlpha2 = feed.CountryCodeAlpha2.Trim().ToUpperInvariant();

          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("HTTP Jobberman sync start: {CountryCodeAlpha2}", countryCodeAlpha2);

          var tracking = _feedSyncTrackingRepository.Query().SingleOrDefault(t => t.CountryCodeAlpha2 == countryCodeAlpha2);
          var isNewTracking = tracking is null;
          tracking ??= new FeedSyncTracking { CountryCodeAlpha2 = countryCodeAlpha2 };

          if (string.IsNullOrWhiteSpace(_options.BaseUrl))
            throw new InvalidOperationException("Jobberman base URL is required");

          var feedUrl = $"{_options.BaseUrl.TrimEnd('/')}/{feed.UrlSuffix.TrimStart('/')}";

          // Always bypass CDN/cache variants with a cache-buster.
          // This is important because the feed is treated as a complete snapshot and each successful refresh
          // must process the full feed to detect items missing from the latest feed.
          var freshUrl = Microsoft.AspNetCore.WebUtilities.QueryHelpers.AddQueryString(feedUrl, "cb", now.ToString("yyyyMMddHHmmss"));

          using var resp = await HttpHelper.SendWithRetryAsync(
            client,
            requestFactory: () =>
            {
              var req = new HttpRequestMessage(HttpMethod.Get, freshUrl);

              req.Headers.TryAddWithoutValidation("Accept", "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5");
              req.Headers.TryAddWithoutValidation("Accept-Language", "en");
              req.Headers.TryAddWithoutValidation("Cache-Control", "no-cache");
              req.Headers.TryAddWithoutValidation("Pragma", "no-cache");

              // Conditional headers are disabled by default because the Jobberman feed is treated as a complete snapshot.
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
              _logger.LogInformation("HTTP Jobberman sync 304 Not Modified: {CountryCodeAlpha2}", countryCodeAlpha2);

            continue;
          }

          resp.EnsureSuccessStatusCode();

          await using var stream = await resp.Content.ReadAsStreamAsync();
          var doc = XMLHelper.Load(stream);

          var opportunities = ParseOpportunities(feed, doc);

          await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
          {
            using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

            await ProcessOpportunities(feed, opportunities, now);

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
            _logger.LogInformation("HTTP Jobberman sync complete: {CountryCodeAlpha2}", countryCodeAlpha2);
        }
        catch (Exception ex)
        {
          if (_logger.IsEnabled(LogLevel.Error))
            _logger.LogError(ex, "Error during HTTP Jobberman sync for country feed {CountryCodeAlpha2}: {ErrorMessage}", feed.CountryCodeAlpha2, ex.Message);
        }
      }
    }

    private static XDocument ParseLocalFeed(JobbermanFeedOptions feed)
    {
      ArgumentNullException.ThrowIfNull(feed, nameof(feed));

      if (string.IsNullOrWhiteSpace(feed.EmbeddedResourceName))
        throw new ArgumentNullException(nameof(feed), "Embedded resource name is required");

      var assembly = typeof(OpportunityFeedBackgroundService).Assembly;
      var assemblyName = assembly.GetName().Name;

      var resourceName = $"{assemblyName}.{feed.EmbeddedResourceName.Trim()}";

      using var resourceStream = assembly.GetManifestResourceStream(resourceName)
        ?? throw new InvalidOperationException($"Embedded resource '{resourceName}' not found. Ensure file is added to the project, marked as Embedded Resource, and compiled into the assembly");

      return XMLHelper.Load(resourceStream);
    }

    private static List<Opportunity> ParseOpportunities(JobbermanFeedOptions feed, XDocument doc)
    {
      ArgumentNullException.ThrowIfNull(feed, nameof(feed));
      ArgumentNullException.ThrowIfNull(doc, nameof(doc));

      if (string.IsNullOrWhiteSpace(feed.CountryCodeAlpha2))
        throw new ArgumentNullException(nameof(feed), "Country code alpha 2 is required");

      var countryCodeAlpha2 = feed.CountryCodeAlpha2.Trim().ToUpperInvariant();

      var items = doc.Root?.Descendants("item") ?? [];
      var opportunities = new List<Opportunity>();

      foreach (var x in items)
      {
        var sourceId = x.GetElementText("guid");
        var title = x.GetElementText("title");

        // Skip malformed items: must have stable source id and title.
        if (string.IsNullOrEmpty(sourceId) || string.IsNullOrEmpty(title))
          continue;

        // Optional / not present in current Jobberman XML samples.
        // Best-effort mapping if the field appears later; otherwise defaults to sync/import date.
        var dateStart = x.TryGetElementDate("pubDate", out var dateStartParsed)
          ? dateStartParsed
          : default(DateTimeOffset?);

        // Optional / not present in current Jobberman XML samples.
        // Best-effort mapping if the field appears later; otherwise treated as open-ended.
        var dateEnd = x.TryGetElementDate("closing_date", out var dateEndParsed)
          ? dateEndParsed
          : default(DateTimeOffset?);

        // Optional / not present in current Jobberman XML samples.
        // Best-effort mapping if the field appears later; otherwise defaults to Other.
        var category = x.GetElementText("job_function");

        // Optional / not present in current Jobberman XML samples.
        // Best-effort mapping if the field appears later; otherwise defaults to English.
        var language = x.GetElementText("language");

        // Optional / not present in current Jobberman XML samples.
        // Best-effort mapping if the field appears later; otherwise no salary is appended.
        var salary = x.GetElementText("salary");

        var description = x.GetElementText("description");
        if (!string.IsNullOrWhiteSpace(salary))
          description = $"{description}{Environment.NewLine}{Environment.NewLine}Salary: {salary}";

        opportunities.Add(new Opportunity
        {
          ExternalId = $"{countryCodeAlpha2}:{sourceId}",
          CountryCodeAlpha2 = countryCodeAlpha2,
          SourceId = sourceId,
          Title = title,
          Description = description,
          URL = x.GetElementText("link"),
          ImageURL = x.Element(XNamespace_MediaNs + "content").GetAttribute("url"),
          Location = x.GetElementText("location"),
          WorkType = x.GetElementText("work_type"),
          DateStart = dateStart,
          DateEnd = dateEnd,
          Category = category,
          Language = language,

          // Jobberman confirmed removal is derived from absence in the full snapshot.
          // Items present in the latest successful feed are not deleted.
          Deleted = false
        });
      }

      return opportunities;
    }

    private async Task ProcessOpportunities(JobbermanFeedOptions feed, List<Opportunity> opportunities, DateTimeOffset now)
    {
      ArgumentNullException.ThrowIfNull(feed, nameof(feed));
      ArgumentNullException.ThrowIfNull(opportunities, nameof(opportunities));

      if (string.IsNullOrWhiteSpace(feed.CountryCodeAlpha2))
        throw new ArgumentNullException(nameof(feed), "Country code alpha 2 is required");

      var countryCodeAlpha2 = feed.CountryCodeAlpha2.Trim().ToUpperInvariant();

      if (opportunities.Count == 0)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("Jobberman feed '{CountryCodeAlpha2}' returned no opportunities. Skipping processing to avoid marking existing items as deleted", countryCodeAlpha2);

        return;
      }

      // Deduplicate incoming rows by ExternalId first.
      // ExternalId is the stable provider identity used by the Jobberman cache table.
      var itemsNormalizedRaw = opportunities
        .GroupBy(o => o.ExternalId, StringComparer.Ordinal)
        .Select(g => g.First())
        .ToList();

      // Normalize and cap titles before duplicate detection so duplicate checks use the same
      // title value that is stored and later sent to the Yoma domain sync.
      itemsNormalizedRaw.ForEach(o => o.Title = NormalizeTitle(o.Title));
      itemsNormalizedRaw = [.. itemsNormalizedRaw.Where(o => !string.IsNullOrWhiteSpace(o.Title))];

      if (itemsNormalizedRaw.Count == 0)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("Jobberman feed '{CountryCodeAlpha2}' returned no valid opportunities after title normalization. Skipping processing to avoid marking existing items as deleted", countryCodeAlpha2);

        return;
      }

      // Match the domain sync listing order for deterministic processing.
      itemsNormalizedRaw = [.. itemsNormalizedRaw.OrderBy(o => o.ExternalId)];

      var incomingExternalIds = itemsNormalizedRaw
        .Select(o => o.ExternalId)
        .ToHashSet(StringComparer.Ordinal);

      // Load existing rows before duplicate detection.
      // This lets us keep the same active non-duplicate row as canonical when duplicate titles
      // remain present across sync runs, avoiding unnecessary duplicate flipping and downstream churn.
      var itemsExisting = _opportunityRepository.Query()
        .Where(o => o.CountryCodeAlpha2 == countryCodeAlpha2)
        .ToList()
        .ToDictionary(o => o.ExternalId, StringComparer.Ordinal);

      ApplyActiveFeedTitleDuplicates(itemsNormalizedRaw, itemsExisting.Values);

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
            CountryCodeAlpha2 = item.CountryCodeAlpha2,
            SourceId = item.SourceId,
            Title = item.Title,
            Description = item.Description,
            URL = item.URL,
            ImageURL = item.ImageURL,
            Location = item.Location,
            WorkType = item.WorkType,

            // Jobberman confirmed DateStart should use posted/publish date when supplied.
            // Until the XML property name is confirmed, default once to the current sync/import time.
            DateStart = item.DateStart ?? now,

            DateEnd = item.DateEnd,
            Category = item.Category,
            Language = item.Language,
            Deleted = item.Deleted,
            Duplicate = item.Duplicate,
            DateCreated = now,
            DateModified = now
          });

          continue;
        }

        // Deleted is terminal. If an item was already marked as deleted, do not reactivate or update it,
        // even if it appears in the feed again.
        if (itemExisting.Deleted == true)
          continue;

        var changed = false;

        if (!string.Equals(itemExisting.Title, item.Title, StringComparison.OrdinalIgnoreCase))
        { itemExisting.Title = item.Title; changed = true; }

        if (!string.Equals(itemExisting.Description, item.Description, StringComparison.Ordinal))
        { itemExisting.Description = item.Description; changed = true; }

        if (!string.Equals(itemExisting.URL, item.URL, StringComparison.Ordinal))
        { itemExisting.URL = item.URL; changed = true; }

        if (!string.Equals(itemExisting.ImageURL, item.ImageURL, StringComparison.Ordinal))
        { itemExisting.ImageURL = item.ImageURL; changed = true; }

        if (!string.Equals(itemExisting.Location, item.Location, StringComparison.Ordinal))
        { itemExisting.Location = item.Location; changed = true; }

        if (!string.Equals(itemExisting.WorkType, item.WorkType, StringComparison.Ordinal))
        { itemExisting.WorkType = item.WorkType; changed = true; }

        // Only update DateStart when Jobberman supplies a parsed posted/publish date.
        // If omitted, keep the stable default captured when the row was first created.
        if (item.DateStart.HasValue && itemExisting.DateStart != item.DateStart)
        { itemExisting.DateStart = item.DateStart; changed = true; }

        // Omitted DateEnd means open-ended / no end date.
        if (itemExisting.DateEnd != item.DateEnd)
        { itemExisting.DateEnd = item.DateEnd; changed = true; }

        if (!string.Equals(itemExisting.Category, item.Category, StringComparison.Ordinal))
        { itemExisting.Category = item.Category; changed = true; }

        if (!string.Equals(itemExisting.Language, item.Language, StringComparison.Ordinal))
        { itemExisting.Language = item.Language; changed = true; }

        if (itemExisting.Duplicate != item.Duplicate)
        { itemExisting.Duplicate = item.Duplicate; changed = true; }

        if (changed)
        {
          itemExisting.DateModified = now;
          itemsToUpdate.Add(itemExisting);
        }
      }

      // Jobberman confirmed the RSS feed is a complete current snapshot.
      // If a previously seen item is missing from the latest successful non-empty feed,
      // treat it as removed/expired locally.
      // Deleted is terminal and must not be reversed if the item later reappears.
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
          .Where(o => o.CountryCodeAlpha2 == countryCodeAlpha2
            && o.Deleted == true
            && o.DateModified < cutoffUtc)
          .ToList();

        if (itemsStale.Count > 0)
        {
          await _opportunityRepository.Delete(itemsStale);
          deletedCount = itemsStale.Count;
        }
      }

      var duplicateCount = itemsNormalizedRaw.Count(o => o.Duplicate == true);

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Jobberman feed {CountryCodeAlpha2} sync summary: Created={Created}, Updated={Updated}, MarkedDeleted={MarkedDeleted}, Duplicates={Duplicates}, Purged={Purged}",
          countryCodeAlpha2, itemsToCreate.Count, itemsToUpdate.Count, itemsToMarkDeleted.Count, duplicateCount, deletedCount);
    }

    private static string NormalizeTitle(string? title)
    {
      title = title?.NormalizeTrimMultiline();

      return string.IsNullOrWhiteSpace(title)
        ? string.Empty
        : title.TrimToLengthWithEllipsis(OpportunityService.Title_MaxLength);
    }

    /// <summary>
    /// Marks duplicate Jobberman jobs by normalized title within the latest active feed snapshot.
    ///
    /// Duplicate detection is intentionally limited to the current feed. Retention may later purge
    /// old deleted rows, so old history is not required to decide the current active set.
    /// If the same title appears again across sync runs, the existing active non-duplicate row is
    /// kept as canonical when it is still present in the feed. This avoids unnecessary duplicate
    /// flipping and downstream sync churn.
    /// </summary>
    private static void ApplyActiveFeedTitleDuplicates(List<Opportunity> items, IEnumerable<Opportunity> itemsExisting)
    {
      ArgumentNullException.ThrowIfNull(items);
      ArgumentNullException.ThrowIfNull(itemsExisting);

      var existingCanonicalByTitle = itemsExisting
        .Where(o => o.Deleted != true && o.Duplicate != true && !string.IsNullOrWhiteSpace(o.Title))
        .GroupBy(o => ToTitleDedupeKey(o.Title), StringComparer.OrdinalIgnoreCase)
        .ToDictionary(
          g => g.Key,
          g => g.OrderBy(o => o.DateCreated).ThenBy(o => o.ExternalId).First().ExternalId,
          StringComparer.OrdinalIgnoreCase);

      foreach (var group in items.GroupBy(o => ToTitleDedupeKey(o.Title), StringComparer.OrdinalIgnoreCase))
      {
        var groupItems = group.OrderBy(o => o.ExternalId).ToList();

        var canonicalExternalId = existingCanonicalByTitle.TryGetValue(group.Key, out var existingExternalId) &&
            groupItems.Any(o => string.Equals(o.ExternalId, existingExternalId, StringComparison.Ordinal))
          ? existingExternalId
          : groupItems.First().ExternalId;

        foreach (var item in groupItems)
          item.Duplicate = !string.Equals(item.ExternalId, canonicalExternalId, StringComparison.Ordinal);
      }
    }

    private static string ToTitleDedupeKey(string? title)
    {
      title = title?.NormalizeTrimMultiline();

      return string.IsNullOrWhiteSpace(title)
        ? string.Empty
        : title;
    }
    #endregion
  }
}
