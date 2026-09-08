using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Infrastructure.Umuzi.Interfaces;
using Yoma.Core.Infrastructure.Umuzi.Models;

namespace Yoma.Core.Infrastructure.Umuzi.Services
{
  public sealed class OpportunityCatalogueBackgroundService : IOpportunityCatalogueBackgroundService
  {
    #region Class Variables
    private readonly ILogger<OpportunityCatalogueBackgroundService> _logger;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly UmuziOptions _options;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IRepositoryBatched<Opportunity> _opportunityRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IUmuziExecutionStrategyService _executionStrategyService;
    private readonly IUmuziAuthService _umuziAuthService;
    #endregion

    #region Constructor
    public OpportunityCatalogueBackgroundService(
      ILogger<OpportunityCatalogueBackgroundService> logger,
      IEnvironmentProvider environmentProvider,
      IOptions<UmuziOptions> options,
      IOptions<AppSettings> appSettings,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IRepositoryBatched<Opportunity> opportunityRepository,
      IDistributedLockService distributedLockService,
      IUmuziExecutionStrategyService executionStrategyService,
      IUmuziAuthService umuziAuthService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _environmentProvider = environmentProvider ?? throw new ArgumentNullException(nameof(environmentProvider));
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));
      _scheduleJobOptions = scheduleJobOptions.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));
      _opportunityRepository = opportunityRepository ?? throw new ArgumentNullException(nameof(opportunityRepository));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
      _executionStrategyService = executionStrategyService ?? throw new ArgumentNullException(nameof(executionStrategyService));
      _umuziAuthService = umuziAuthService ?? throw new ArgumentNullException(nameof(umuziAuthService));
    }
    #endregion

    #region Public Members
    public async Task RefreshCatalogue(bool onStartupInitialRefresh)
    {
      const string lockIdentifier = "umuzi_partner_sync_opportunity_catalogue_refresh";

      var maxIntervalInHours = _options.PollScheduleMaxIntervalInHours > 0
        ? _options.PollScheduleMaxIntervalInHours
        : _scheduleJobOptions.DefaultScheduleMaxIntervalInHours;

      var lockDuration = TimeSpan.FromHours(maxIntervalInHours)
        + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Umuzi catalogue refresh skipped: lock '{lockIdentifier}' is held by another execution", lockIdentifier);
          return;
        }

        var syncFromExternalPartners = _appSettings.IsPartnerSyncEnabled(SyncPartner.Umuzi, _environmentProvider.Environment);

        if (onStartupInitialRefresh && syncFromExternalPartners)
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation(
              "Refreshing (On Startup) of Umuzi partner sync opportunity catalogue skipped because external partner synchronization is enabled for environment '{environment}'",
              _environmentProvider.Environment);

          return;
        }

        if (onStartupInitialRefresh && _opportunityRepository.Query().Any())
        {
          if (_logger.IsEnabled(LogLevel.Information))
            _logger.LogInformation("Refreshing (On Startup) of Umuzi partner sync opportunity catalogue skipped because local cache already contains data");

          return;
        }

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processing Umuzi partner sync opportunity catalogue refresh");

        var now = DateTimeOffset.UtcNow;
        var opportunities = syncFromExternalPartners
          ? await GetCompleteCatalogueFromApi()
          : LoadEmbeddedCatalogue();

        await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
        {
          using var scope = TransactionScopeHelper.CreateReadCommitted(TransactionScopeOption.RequiresNew);

          await ProcessOpportunities(opportunities, now);

          scope.Complete();
        });

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Processed Umuzi partner sync opportunity catalogue refresh");
      }
      catch (Exception ex)
      {
        if (_logger.IsEnabled(LogLevel.Error))
          _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(RefreshCatalogue), ex.Message);
        // Let Hangfire expose failures and retry; retaining the prior snapshot is intentional.
        throw;
      }
      finally
      {
        if (lockAcquired)
          await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private List<OpportunityResponse> LoadEmbeddedCatalogue()
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using local .NET embedded Umuzi partner sync opportunity catalogue resource. No external API request will be performed");

      var response = LoadEmbeddedPage<OpportunityResponse>(_options.OpportunitiesEmbeddedResourceName);
      ContractValidation.ValidatePage(response, 1, null, null);
      if (response.Items.Count != response.TotalItems)
        throw new InvalidOperationException("Embedded Umuzi catalogue must contain the complete snapshot");

      return response.Items;
    }

    private static PageResponse<TItem> LoadEmbeddedPage<TItem>(string resourceName)
    {
      resourceName = resourceName?.Trim()
        ?? throw new InvalidOperationException("Umuzi embedded resource name is required");

      if (resourceName.Length == 0)
        throw new InvalidOperationException("Umuzi embedded resource name is required");

      var assembly = typeof(OpportunityCatalogueBackgroundService).Assembly;
      var fullResourceName = $"{assembly.GetName().Name}.{resourceName}";

      using var stream = assembly.GetManifestResourceStream(fullResourceName)
        ?? throw new InvalidOperationException($"Embedded Umuzi sample resource '{fullResourceName}' not found");

      using var reader = new StreamReader(stream);
      return JsonConvert.DeserializeObject<PageResponse<TItem>>(reader.ReadToEnd())
        ?? throw new InvalidOperationException($"Failed to deserialize embedded Umuzi resource '{fullResourceName}'");
    }

    private async Task<List<OpportunityResponse>> GetCompleteCatalogueFromApi()
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using Umuzi API. The complete opportunity catalogue will be retrieved before local cache processing");

      var opportunities = new List<OpportunityResponse>();
      int? expectedTotal = null;
      int? expectedPageSize = null;

      for (var pageNumber = 1; ; pageNumber++)
      {
        var page = await GetOpportunityPage(pageNumber, Constants.PageSizeMaximum);
        ContractValidation.ValidatePage(page, pageNumber, expectedTotal, expectedPageSize);

        expectedTotal ??= page.TotalItems;
        expectedPageSize ??= page.PageSize;
        opportunities.AddRange(page.Items);

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation(
            "Loaded Umuzi opportunity page '{page}' with '{count}' items; expected total '{totalItems}'",
            pageNumber, page.Items.Count, page.TotalItems);

        if (opportunities.Count >= page.TotalItems)
          break;

        if (page.Items.Count == 0)
          throw new InvalidOperationException($"Umuzi opportunity page '{pageNumber}' was empty before the final page");
      }

      return opportunities;
    }

    private async Task<PageResponse<OpportunityResponse>> GetOpportunityPage(int pageNumber, int pageSize)
    {
      return await _options.BaseUrl
        .AppendPathSegment(_options.OpportunitiesPath)
        .SetQueryParam(Constants.QueryPage, pageNumber)
        .SetQueryParam(Constants.QueryPageSize, pageSize)
        .WithAuthHeader(await _umuziAuthService.GetAuthHeader())
        .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
        .GetAsync()
        .EnsureSuccessStatusCodeAsync()
        .ReceiveJson<PageResponse<OpportunityResponse>>();
    }

    private async Task ProcessOpportunities(List<OpportunityResponse> opportunities, DateTimeOffset now)
    {
      ArgumentNullException.ThrowIfNull(opportunities);

      if (opportunities.Count == 0)
      {
        if (_logger.IsEnabled(LogLevel.Warning))
          _logger.LogWarning("Umuzi partner sync opportunity catalogue returned no opportunities. Skipping processing to avoid deleting existing items");

        return;
      }

      NormalizeAndValidate(opportunities);

      var duplicateIds = opportunities
        .GroupBy(o => o.ExternalId, StringComparer.Ordinal)
        .Where(group => group.Count() > 1)
        .Select(group => group.Key)
        .ToList();

      if (duplicateIds.Count > 0)
        throw new InvalidOperationException($"Umuzi partner sync opportunity catalogue contains duplicate external ids: '{string.Join(", ", duplicateIds)}'");

      var incoming = opportunities
        .Select(ToOpportunity)
        .ToList();

      var incomingExternalIds = incoming
        .Select(o => o.ExternalId)
        .ToHashSet(StringComparer.Ordinal);

      var existing = _opportunityRepository.Query()
        .ToList()
        .ToDictionary(o => o.ExternalId, StringComparer.Ordinal);

      var create = new List<Opportunity>();
      var update = new List<Opportunity>();
      var markedDeletedByFlag = 0;
      var markedDeletedByOmission = 0;

      foreach (var item in incoming)
      {
        if (!existing.TryGetValue(item.ExternalId, out var current))
        {
          item.DateCreated = now;
          item.DateModified = now;
          create.Add(item);

          if (item.Deleted == true)
            markedDeletedByFlag++;

          continue;
        }

        // Removal is terminal. A previously deleted external id is never reactivated or reused.
        if (current.Deleted == true)
          continue;

        var changed = !string.Equals(current.PayloadHash, item.PayloadHash, StringComparison.Ordinal);
        var newlyDeleted = item.Deleted == true;

        if (!changed && !newlyDeleted)
          continue;

        current.PayloadHash = item.PayloadHash;
        current.PayloadJson = item.PayloadJson;
        current.Deleted = newlyDeleted;
        current.DateModified = now;
        update.Add(current);

        if (newlyDeleted)
          markedDeletedByFlag++;
      }

      // Integration assumption: this endpoint supplies a complete snapshot.
      // active=false and omission both mean terminal deletion in Yoma, even if Umuzi reactivates.
      // After every page has succeeded, omission of a previously active item is treated as a
      // terminal removal fallback. Partial, failed, duplicate, or empty snapshots never reach here.
      foreach (var current in existing.Values.Where(o =>
        o.Deleted != true && !incomingExternalIds.Contains(o.ExternalId)))
      {
        current.Deleted = true;
        current.DateModified = now;
        update.Add(current);
        markedDeletedByOmission++;
      }

      if (create.Count > 0)
        await _opportunityRepository.Create(create);

      if (update.Count > 0)
        await _opportunityRepository.Update([.. update.DistinctBy(o => o.Id)]);

      var purged = 0;
      if (_options.RetentionDays >= 0)
      {
        var cutoff = now.AddDays(-_options.RetentionDays);
        var stale = _opportunityRepository.Query()
          .Where(o => o.Deleted == true && o.DateModified < cutoff)
          .ToList();

        if (stale.Count > 0)
        {
          await _opportunityRepository.Delete(stale);
          purged = stale.Count;
        }
      }

      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation(
          "Umuzi partner sync opportunity catalogue sync summary: Created={Created}, Updated={Updated}, RemovedByFlag={RemovedByFlag}, RemovedByOmission={RemovedByOmission}, Purged={Purged}",
          create.Count, update.Count, markedDeletedByFlag, markedDeletedByOmission, purged);
    }

    private static void NormalizeAndValidate(List<OpportunityResponse> opportunities)
    {
      foreach (var item in opportunities)
      {
        item.ExternalId = item.ExternalId?.Trim()
          ?? throw new InvalidOperationException("Umuzi opportunity external id is required");

        if (item.ExternalId.Length == 0 || item.ExternalId.Length > 50)
          throw new InvalidOperationException($"Umuzi opportunity external id must contain between 1 and 50 characters. Value: '{item.ExternalId}'");

        if (!item.Active.HasValue)
          throw new InvalidOperationException($"Umuzi opportunity '{item.ExternalId}' does not contain the required active flag");

        item.Type = (item.Type ?? string.Empty).Trim();
        ContractValidation.ParseOpportunityType(item.Type);

        // Inactive records are terminal tombstones; identity and the active flag suffice.
        if (item.Active == false) continue;

        item.Title = (item.Title ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(item.Title))
          throw new InvalidOperationException($"Umuzi opportunity '{item.ExternalId}' title is required");

        item.URL = (item.URL ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(item.URL))
          throw new InvalidOperationException($"Umuzi opportunity '{item.ExternalId}' URL is required");

        if (item.StartDate == default)
          throw new InvalidOperationException($"Umuzi opportunity '{item.ExternalId}' start date is required");

        if (item.Countries == null || item.Countries.Count == 0)
          throw new InvalidOperationException($"Umuzi opportunity '{item.ExternalId}' must contain at least one country");
      }
    }

    private static Opportunity ToOpportunity(OpportunityResponse opportunity)
    {
      var payloadJson = HashHelper.SerializeForHashing(opportunity);

      return new Opportunity
      {
        ExternalId = opportunity.ExternalId,
        PayloadHash = HashHelper.ComputeSHA256Hash(payloadJson),
        PayloadJson = payloadJson,
        Deleted = opportunity.Active == false
      };
    }
    #endregion
  }
}
