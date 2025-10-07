using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Transactions;
using System.Xml.Linq;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.NewsFeedProvider;
using Yoma.Core.Domain.NewsFeedProvider.Models;
using Yoma.Core.Infrastructure.Substack.Interfaces;
using Yoma.Core.Infrastructure.Substack.Models;

namespace Yoma.Core.Infrastructure.Substack.Services
{
  public class NewsFeedBackgroundService : INewsFeedBackgroundService
  {
    #region Class Variables
    private readonly ILogger<NewsFeedBackgroundService> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly SubstackOptions _options;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IRepositoryBatchedValueContains<NewsArticle> _newsArticleRepository;
    private readonly IRepository<FeedSyncTracking> _feedSyncTrackingRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IExecutionStrategyService _executionStrategyService;

    private const string XNamespace_Media = "http://search.yahoo.com/mrss/";
    private const string XNamespace_Content = "http://purl.org/rss/1.0/modules/content/";
    private const string XNamespace_Dc = "http://purl.org/dc/elements/1.1/";
    #endregion

    #region Constructor
    public NewsFeedBackgroundService(
      ILogger<NewsFeedBackgroundService> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<SubstackOptions> options,
      IOptions<AppSettings> appSettings,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IHttpClientFactory httpClientFactory,
      IRepositoryBatchedValueContains<NewsArticle> newsArticleRepository,
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
      _newsArticleRepository = newsArticleRepository ?? throw new ArgumentNullException(nameof(newsArticleRepository));
      _feedSyncTrackingRepository = feedSyncTrackingRepository ?? throw new ArgumentNullException(nameof(feedSyncTrackingRepository));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
    }
    #endregion

    #region Public Members
    public async Task RefreshFeeds(bool onStartupInitialRefresh)
    {
      const string lockIdentifier = "news_feed_refresh_feeds";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        if (onStartupInitialRefresh && _newsArticleRepository.Query().Any())
        {
          _logger.LogInformation("Refreshing (On Startup) of news feeds skipped");
          return;
        }

        _logger.LogInformation("Processing news feed refresh");

        var now = DateTimeOffset.UtcNow;
        if (_appSettings.NewsFeedProviderAsSourceEnabledEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
          await RefreshFromRSSFeedAsync(now);
        else
          await RefreshFromFileAsync(now);

        _logger.LogInformation("Processed news feed refresh");
      }
      catch (Exception ex)
      {
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
      _logger.LogInformation("Using embedded RSS (file mode). No state tracking will be performed");

      foreach (var (feedType, _) in _options.Feeds)
      {
        try
        {
          _logger.LogInformation("File-mode sync start: {FeedType}", feedType);

          var xmlDoc = ParseLocalFeed(feedType);

          var articles = ParseNewsArticles(xmlDoc, now);

          await ProcessNewsArticles(feedType, articles, now);

          _logger.LogInformation("File-mode sync complete: {FeedType}", feedType);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Error during file-mode sync for feed {FeedType}", feedType);
        }
      }
    }

    private async Task RefreshFromRSSFeedAsync(DateTimeOffset now)
    {
      _logger.LogInformation("Using Substack RSS (HTTP mode). Feed state tracking (ETag, Last-Modified) will be applied");

      var client = _httpClientFactory.CreateClient(nameof(NewsFeedBackgroundService));
      client.Timeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds);
      client.DefaultRequestHeaders.UserAgent.ParseAdd(_options.UserAgent);

      foreach (var (feedType, feedUrl) in _options.Feeds)
      {
        try
        {
          _logger.LogInformation("HTTP sync start: {FeedType}", feedType);

          var tracking = _feedSyncTrackingRepository.Query().SingleOrDefault(t => t.FeedType == feedType);
          var isNewTracking = tracking is null;
          tracking ??= new FeedSyncTracking { FeedType = feedType };

          using var req = new HttpRequestMessage(HttpMethod.Get, feedUrl);

          // Conditional headers only if we have state
          if (!isNewTracking)
          {
            if (!string.IsNullOrEmpty(tracking.ETag))
              req.Headers.TryAddWithoutValidation("If-None-Match", tracking.ETag);

            if (tracking.FeedLastModified.HasValue)
              req.Headers.TryAddWithoutValidation("If-Modified-Since", tracking.FeedLastModified.Value.UtcDateTime.ToString("R"));
          }

          using var resp = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);

          if (resp.StatusCode == System.Net.HttpStatusCode.NotModified)
          {
            _logger.LogInformation("HTTP sync 304 Not Modified: {FeedType}", feedType);
            continue;
          }

          resp.EnsureSuccessStatusCode();

          await using var stream = await resp.Content.ReadAsStreamAsync();
          var doc = XDocument.Load(stream);

          var articles = ParseNewsArticles(doc, now);

          await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
          {
            using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

            await ProcessNewsArticles(feedType, articles, now);

            // Update feed state tracking
            tracking.ETag = resp.Headers.ETag?.Tag.Trim();
            tracking.FeedLastModified = resp.Content.Headers.LastModified;

            if (isNewTracking)
              await _feedSyncTrackingRepository.Create(tracking);
            else
              await _feedSyncTrackingRepository.Update(tracking);

            scope.Complete();
          });

          _logger.LogInformation("HTTP sync complete: {FeedType}", feedType);
        }
        catch (Exception ex)
        {
          _logger.LogError(ex, "Error during HTTP sync for feed {FeedType}", feedType);
        }
      }
    }

    private async Task ProcessNewsArticles(FeedType feedType, List<NewsArticleRaw> articles, DateTimeOffset now)
    {
      // Retention: -1 means "keep forever" (no cutoff, no deletions)
      var retentionEnabled = _options.RetentionDays >= default(int);
      var cutoffUtc = retentionEnabled ? now.AddDays(-_options.RetentionDays) : (DateTimeOffset?)null;

      // Deduplicate incoming by ExternalId (keep the newest by PublishedDate)
      var itemsNormalizedRaw = articles
        .GroupBy(a => a.ExternalId, StringComparer.Ordinal)
        .Select(g => g.OrderByDescending(a => a.PublishedDate).First())
        .ToList();

      // If retention is enabled, only consider incoming items within the window
      if (retentionEnabled && cutoffUtc.HasValue)
        itemsNormalizedRaw = [.. itemsNormalizedRaw.Where(a => a.PublishedDate >= cutoffUtc.Value)];

      // Load existing from DB for this feed (limit by window if retention enabled)
      var existingQuery = _newsArticleRepository.Query().Where(a => a.FeedType == feedType.ToString());
      if (retentionEnabled && cutoffUtc.HasValue)
        existingQuery = existingQuery.Where(a => a.PublishedDate >= cutoffUtc.Value);

      var itemsExisting = existingQuery.ToList().ToDictionary(a => a.ExternalId, StringComparer.Ordinal);

      // Build batched creates/updates (repo is dumb; change detection here)
      var itemsToCreate = new List<NewsArticle>();
      var itemsToUpdate = new List<NewsArticle>();

      foreach (var item in itemsNormalizedRaw)
      {
        if (!itemsExisting.TryGetValue(item.ExternalId, out var itemExisting))
        {
          itemsToCreate.Add(new NewsArticle
          {
            FeedType = feedType.ToString(),
            ExternalId = item.ExternalId,
            Title = item.Title,
            Description = item.Description,
            URL = item.URL,
            ThumbnailURL = item.ThumbnailURL,
            PublishedDate = item.PublishedDate
          });
          continue;
        }

        var changed = false;

        if (!string.Equals(itemExisting.Title, item.Title, StringComparison.InvariantCultureIgnoreCase))
        { itemExisting.Title = item.Title; changed = true; }

        if (!string.Equals(itemExisting.Description, item.Description, StringComparison.Ordinal))
        { itemExisting.Description = item.Description; changed = true; }

        if (!string.Equals(itemExisting.ThumbnailURL, item.ThumbnailURL, StringComparison.Ordinal))
        { itemExisting.ThumbnailURL = item.ThumbnailURL; changed = true; }

        if (!string.Equals(itemExisting.URL, item.URL, StringComparison.Ordinal))
        { itemExisting.URL = item.URL; changed = true; }

        if (itemExisting.PublishedDate != item.PublishedDate)
        { itemExisting.PublishedDate = item.PublishedDate; changed = true; }

        if (changed) itemsToUpdate.Add(itemExisting);
      }

      // Batch persist
      if (itemsToCreate.Count > 0)
        await _newsArticleRepository.Create(itemsToCreate);

      if (itemsToUpdate.Count > 0)
        await _newsArticleRepository.Update(itemsToUpdate);

      // Deletions: ONLY retention purge (do NOT delete "missing from this batch" due to conditional fetch)
      if (retentionEnabled)
      {
        if (!cutoffUtc.HasValue)
          throw new InvalidOperationException("Cutoff must have a value if retention is enabled");

        var itemsStale = _newsArticleRepository.Query()
          .Where(a => a.FeedType == feedType.ToString() && a.PublishedDate < cutoffUtc.Value)
          .ToList();

        if (itemsStale.Count > 0)
          await _newsArticleRepository.Delete(itemsStale);
      }
    }

    private static List<NewsArticleRaw> ParseNewsArticles(XDocument doc, DateTimeOffset now)
    {
      var items = doc.Root?.Descendants("item") ?? [];
      var articles = new List<NewsArticleRaw>();

      foreach (var x in items)
      {
        var guid = x.Element("guid")?.Value?.Trim();
        var link = x.Element("link")?.Value?.Trim();

        // Skip malformed items: must have a navigable link
        if (string.IsNullOrWhiteSpace(link))
          continue;

        // Prefer GUID for stable deduplication; fallback to link
        var externalId = !string.IsNullOrWhiteSpace(guid) ? guid : link;

        var title = x.Element("title")?.Value?.Trim() ?? string.Empty;

        // Body HTML: prefer <content:encoded>, else <description>
        var html = (string?)x.Element(XNamespace.Get(XNamespace_Content) + "encoded")
                  ?? (string?)x.Element("description")
                  ?? string.Empty;

        // Media: <media:thumbnail> or <media:content>
        var thumb = (string?)x.Element(XNamespace.Get(XNamespace_Media) + "thumbnail")?.Attribute("url")?.Value?.Trim()
                    ?? (string?)x.Element(XNamespace.Get(XNamespace_Media) + "content")?.Attribute("url")?.Value?.Trim();

        // Published date: <pubDate>, <dc:date>, fallback to now
        var pubRaw = x.Element("pubDate")?.Value?.Trim();
        if (!DateTimeOffset.TryParse(pubRaw, out var published))
        {
          var dcRaw = x.Element(XNamespace.Get(XNamespace_Dc) + "date")?.Value?.Trim();
          if (!DateTimeOffset.TryParse(dcRaw, out published))
            published = now;
        }

        articles.Add(new NewsArticleRaw
        {
          ExternalId = externalId!,
          Title = title,
          Description = html, 
          URL = link!,
          ThumbnailURL = thumb,
          PublishedDate = published
        });
      }

      return articles;
    }

    private static XDocument ParseLocalFeed(FeedType feedType)
    {
      var assembly = typeof(NewsFeedBackgroundService).Assembly;
      var assemblyName = assembly.GetName().Name;

      var fileName = feedType switch
      {
        FeedType.General => "yoma-news-general.xml",
        FeedType.AboutUs => "yoma-news-aboutus.xml",
        _ => throw new InvalidOperationException($"Unsupported feed type '{feedType}'"),
      };

      var resourceName = $"{assemblyName}.{fileName}";

      using var resourceStream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded resource '{resourceName}' not found. Ensure Build Action = Embedded Resource");

      return XDocument.Load(resourceStream);
    }
    #endregion
  }
}
