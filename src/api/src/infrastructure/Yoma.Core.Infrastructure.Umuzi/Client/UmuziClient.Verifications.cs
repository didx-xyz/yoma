using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.PartnerSync;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.Umuzi.Models;

namespace Yoma.Core.Infrastructure.Umuzi.Client
{
  public sealed partial class UmuziClient
  {
    #region Private Members
    private SyncResultPullVerification ListVerificationsFromEmbeddedResource(SyncFilterPullVerification filter)
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using local embedded Umuzi verification resource. No external API request will be performed");
      var page = LoadEmbeddedPage<Verification>(_options.VerificationsEmbeddedResourceName);
      ContractValidation.ValidatePage(page, 1, null, null);
      if (page.Items.Count != page.TotalItems)
        throw new InvalidOperationException("Embedded Umuzi verifications must contain the complete sample");
      // Like the other partners, local fixtures ignore wall-clock windows for repeatable debugging.
      var items = page.Items.OrderBy(o => o.RecordedAt)
        .ThenBy(o => o.OpportunityExternalId).ThenBy(o => o.YomaUserId ?? o.Username).ToList();
      var result = new SyncResultPullVerification { TotalCount = items.Count };
      if (filter.PaginationEnabled)
        items = [.. items.Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value).Take(filter.PageSize.Value)];
      result.Items = [.. items.Select(ToSyncItem)];
      return result;
    }

    private async Task<SyncResultPullVerification> ListVerificationsFromApi(SyncFilterPullVerification filter)
    {
      var items = new List<Verification>();
      int? expectedTotal = null;
      int? expectedPageSize = null;
      for (var pageNumber = 1; ; pageNumber++)
      {
        if (_logger.IsEnabled(LogLevel.Debug))
          _logger.LogDebug("Requesting Umuzi verifications for window '{since}' to '{until}', page '{page}'",
            filter.DateStart, filter.DateEnd, pageNumber);
        // The shared scheduler owns the checkpoint, overlap and initial lookback. Pass its fixed
        // UTC window unchanged. A bounded staging pull confirmed recordedAt filtering for
        // late imports. TODO: Verify that subsequent progress updates advance recordedAt.
        var request = _options.BaseUrl.AppendPathSegment(_options.VerificationsPath)
          .SetQueryParam(Constants.QuerySince, filter.DateStart.ToUniversalTime().ToString("O"))
          .SetQueryParam(Constants.QueryPage, pageNumber)
          .SetQueryParam(Constants.QueryPageSize, Constants.PageSizeMaximum)
          .WithAuthHeader(await _umuziAuthService.GetAuthHeader())
          .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds));
        if (filter.DateEnd.HasValue)
          request = request.SetQueryParam(Constants.QueryUntil, filter.DateEnd.Value.ToUniversalTime().ToString("O"));
        var page = await request.GetAsync().EnsureSuccessStatusCodeAsync().ReceiveJson<PageResponse<Verification>>();
        ContractValidation.ValidatePage(page, pageNumber, expectedTotal, expectedPageSize);
        expectedTotal ??= page.TotalItems;
        expectedPageSize ??= page.PageSize;
        items.AddRange(page.Items);
        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation("Loaded Umuzi verification page '{page}', '{loaded}' of '{total}' records",
            pageNumber, items.Count, page.TotalItems);
        if (items.Count >= page.TotalItems) break;
      }

      // Feed order is not specified. Process older records first so a later completion wins.
      // Shared processing hashes skip unchanged effective payloads across overlapping pulls.
      return new SyncResultPullVerification
      {
        TotalCount = items.Count,
        Items = [.. items.OrderBy(o => o.RecordedAt).Select(ToSyncItem)]
      };
    }

    private static PageResponse<T> LoadEmbeddedPage<T>(string resourceName)
    {
      var assembly = typeof(UmuziClient).Assembly;
      var name = $"{assembly.GetName().Name}.{resourceName?.Trim()}";
      using var stream = assembly.GetManifestResourceStream(name)
        ?? throw new InvalidOperationException($"Embedded Umuzi sample resource '{name}' not found");
      using var reader = new StreamReader(stream);
      return JsonConvert.DeserializeObject<PageResponse<T>>(reader.ReadToEnd())
        ?? throw new InvalidOperationException($"Failed to deserialize embedded Umuzi resource '{name}'");
    }

    private SyncItemVerification ToSyncItem(Verification item)
    {
      ArgumentNullException.ThrowIfNull(item);
      var externalId = item.OpportunityExternalId?.Trim();
      var yomaUserId = item.YomaUserId?.NormalizeNullableValue();
      var username = item.Username?.NormalizeNullableValue();
      if (string.IsNullOrEmpty(externalId) || externalId.Length > 50)
        throw new InvalidOperationException("Umuzi verification opportunityExternalId must contain 1 to 50 characters");
      if (yomaUserId == null && username == null)
        throw new InvalidOperationException($"Umuzi verification '{externalId}' requires yomaUserId or username");
      if (yomaUserId != null)
      {
        if (!Guid.TryParse(yomaUserId, out var id) || id == Guid.Empty)
          throw new InvalidOperationException($"Umuzi verification '{externalId}' contains an invalid yomaUserId");
        yomaUserId = id.ToString("D");
      }
      var status = ResolveVerificationStatus(item.Status);
      if (item.PercentComplete is < 0 or > 100)
        throw new InvalidOperationException("Umuzi verification percentComplete must be between 0 and 100");
      var completed = status == SyncItemVerificationStatus.Completed;
      if (completed && (!item.DateCompleted.HasValue || item.DateCompleted == default(DateTimeOffset)))
        throw new InvalidOperationException($"Umuzi completed/placed verification '{externalId}' requires dateCompleted");

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapping Umuzi verification for opportunity '{externalId}' with status '{status}'", externalId, status);
      return new SyncItemVerification
      {
        EntityExternalId = externalId,
        // Umuzi supplies our id explicitly, not a partner user id. The shared resolver has
        // a partner-scoped Yoma-id fallback, followed by current email/mobile matching.
        UserExternalId = yomaUserId ?? username!,
        UserEmail = username?.Contains('@') == true ? username : null,
        UserPhoneNumber = username != null && !username.Contains('@') ? username : null,
        // No learner start/commitment is supplied. The existing domain import uses the
        // opportunity commitment where available, as with other partner verifications.
        DateEnd = completed ? item.DateCompleted : item.EndOrLastActivity,
        DateCompleted = completed ? item.DateCompleted : null,
        Status = status,
        PercentComplete = completed ? 100m : item.PercentComplete ?? 0m
      };
    }

    private static SyncItemVerificationStatus ResolveVerificationStatus(string? value)
      => value?.Trim().ToLowerInvariant() switch
      {
        "completed" or "placed" => SyncItemVerificationStatus.Completed,
        "pending" or "in_progress" => SyncItemVerificationStatus.InProgress,
        _ => throw new InvalidOperationException($"Umuzi verification status '{value}' is not supported")
      };
    #endregion
  }
}
