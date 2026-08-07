using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Yoma.Core.Domain.PartnerSync;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.PartnerSync.Models;
using Yoma.Core.Infrastructure.IXO.PartnerSync.Models;

namespace Yoma.Core.Infrastructure.IXO.PartnerSync.Client
{
  public sealed partial class IXOClient
  {
    #region Private Members
    private SyncResultPullVerification ListVerificationsFromEmbeddedResource(
      SyncFilterPullVerification filter)
    {
      if (_logger.IsEnabled(LogLevel.Information))
        _logger.LogInformation("Using local embedded IXO verification resource. No external API request will be performed");

      var items = LoadEmbeddedPage<Verification>(_options.VerificationsEmbeddedResourceName)
        .Items
        .OrderBy(item => item.DateCompleted ?? item.DateEnd ?? item.DateStart ?? DateTimeOffset.MinValue)
        .ThenBy(item => item.UserReference)
        .ThenBy(item => item.OpportunityReference)
        .ToList();

      var result = new SyncResultPullVerification { TotalCount = items.Count };

      if (filter.PaginationEnabled)
      {
        items = [.. items
          .Skip((filter.PageNumber!.Value - 1) * filter.PageSize!.Value)
          .Take(filter.PageSize.Value)];
      }

      result.Items = [.. items.Select(ToSyncItem)];

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped IXO embedded verification payload to sync result with '{count}' items", result.Items.Count);

      return result;
    }

    private async Task<SyncResultPullVerification> ListVerificationsFromApi(
      SyncFilterPullVerification filter)
    {
      var items = new List<Verification>();
      int? expectedTotalPages = null;

      for (var pageNumber = 1; ; pageNumber++)
      {
        if (_logger.IsEnabled(LogLevel.Debug))
          _logger.LogDebug(
            "Requesting IXO verifications from '{path}' for window '{dateStart}' to '{dateEnd}', page '{page}', page size '{pageSize}'",
            _options.VerificationsPath, filter.DateStart, filter.DateEnd, pageNumber, Constants.PageSizeMaximum);
        var request = _options.BaseUrl
          .AppendPathSegment(_options.VerificationsPath)
          .SetQueryParam(Constants.QuerySince, filter.DateStart.ToUniversalTime().ToString("O"))
          .SetQueryParam(Constants.QueryPage, pageNumber)
          .SetQueryParam(Constants.QueryPageSize, Constants.PageSizeMaximum)
          .WithAuthHeader(await _ixoAuthService.GetAuthHeader())
          .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds));

        if (filter.DateEnd.HasValue)
        {
          request = request.SetQueryParam(
            Constants.QueryUntil,
            filter.DateEnd.Value.ToUniversalTime().ToString("O"));
        }

        var response = await request
          .GetAsync()
          .EnsureSuccessStatusCodeAsync()
          .ReceiveJson<PageResponse<Verification>>();

        ValidateVerificationPage(response, pageNumber, expectedTotalPages);
        expectedTotalPages ??= response.TotalPages;
        items.AddRange(response.Items);

        if (_logger.IsEnabled(LogLevel.Information))
          _logger.LogInformation(
            "Loaded IXO verification page '{page}' of '{totalPages}' with '{count}' items. Total loaded '{totalLoaded}'",
            pageNumber, response.TotalPages, response.Items.Count, items.Count);

        if (pageNumber >= response.TotalPages)
          break;

        if (response.Items.Count == 0)
          throw new InvalidOperationException($"IXO verification page '{pageNumber}' was empty before the final page");
      }

      var result = new SyncResultPullVerification
      {
        TotalCount = items.Count,
        Items = [.. items.Select(ToSyncItem)]
      };

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug("Mapped IXO verification API payload to sync result with '{count}' items", result.Items.Count);

      return result;
    }

    private static void ValidateVerificationPage(
      PageResponse<Verification> response,
      int expectedPage,
      int? expectedTotalPages)
    {
      ArgumentNullException.ThrowIfNull(response);

      if (response.Page != expectedPage)
        throw new InvalidOperationException($"IXO verification response page '{response.Page}' does not match requested page '{expectedPage}'");

      if (response.PageSize <= 0 || response.PageSize > Constants.PageSizeMaximum)
        throw new InvalidOperationException($"IXO verification response page size '{response.PageSize}' is invalid");

      if (response.TotalPages < 1)
        throw new InvalidOperationException($"IXO verification response total pages '{response.TotalPages}' is invalid");

      if (expectedTotalPages.HasValue && response.TotalPages != expectedTotalPages.Value)
        throw new InvalidOperationException($"IXO verification response total pages changed from '{expectedTotalPages.Value}' to '{response.TotalPages}' during retrieval");
    }

    private static PageResponse<TItem> LoadEmbeddedPage<TItem>(string resourceName)
    {
      resourceName = resourceName?.Trim()
        ?? throw new InvalidOperationException("IXO embedded resource name is required");

      if (resourceName.Length == 0)
        throw new InvalidOperationException("IXO embedded resource name is required");

      var assembly = typeof(IXOClient).Assembly;
      var fullResourceName = $"{assembly.GetName().Name}.{resourceName}";

      using var stream = assembly.GetManifestResourceStream(fullResourceName)
        ?? throw new InvalidOperationException($"Embedded IXO sample resource '{fullResourceName}' not found");

      using var reader = new StreamReader(stream);
      return JsonConvert.DeserializeObject<PageResponse<TItem>>(reader.ReadToEnd())
        ?? throw new InvalidOperationException($"Failed to deserialize embedded IXO resource '{fullResourceName}'");
    }

    private SyncItemVerification ToSyncItem(Verification item)
    {
      var opportunityReference = item.OpportunityReference?.Trim();

      var userReference = item.UserReference?.Trim();

      if (string.IsNullOrEmpty(opportunityReference))
        throw new InvalidOperationException("IXO verification opportunity reference is required");

      if (string.IsNullOrEmpty(userReference))
        throw new InvalidOperationException("IXO verification user reference is required");

      var status = ResolveVerificationStatus(item.Status);

      if (_logger.IsEnabled(LogLevel.Debug))
        _logger.LogDebug(
          "Mapping IXO verification for opportunity '{opportunityExternalId}' with status '{status}'",
          opportunityReference, status);

      if (item.PercentComplete is < 0 or > 100)
        throw new InvalidOperationException($"IXO verification percent complete '{item.PercentComplete}' must be between 0 and 100");

      if (status == SyncItemVerificationStatus.Completed && !item.DateCompleted.HasValue)
      {
        throw new InvalidOperationException(
          $"IXO completed/placed verification for opportunity '{opportunityReference}' and user '{userReference}' requires dateCompleted");
      }

      var commitment = ResolveVerificationCommitment(item.Commitment);

      var isGuid = Guid.TryParse(userReference, out _);

      return new SyncItemVerification
      {
        UserExternalId = userReference,
        EntityExternalId = opportunityReference,
        UserEmail = !isGuid && userReference.Contains('@') ? userReference : null,
        UserPhoneNumber = !isGuid && !userReference.Contains('@') ? userReference : null,
        DateStart = commitment == null ? item.DateStart : null,
        DateEnd = item.DateEnd ??
          (status == SyncItemVerificationStatus.Completed ? item.DateCompleted : null),
        CommitmentInterval = commitment,
        Status = status,
        PercentComplete = status == SyncItemVerificationStatus.Completed
          ? 100m
          : item.PercentComplete ?? 0m,
        DateCompleted = status == SyncItemVerificationStatus.Completed
          ? item.DateCompleted
          : null
      };
    }

    private static SyncItemVerificationStatus ResolveVerificationStatus(string? value)
    {
      value = value?.Trim();

      return value?.ToLowerInvariant() switch
      {
        "completed" => SyncItemVerificationStatus.Completed,
        "placed" => SyncItemVerificationStatus.Completed,
        "in-progress" => SyncItemVerificationStatus.InProgress,
        "pending" => SyncItemVerificationStatus.InProgress,
        _ => throw new InvalidOperationException($"IXO verification status '{value}' is not supported")
      };
    }

    private SyncItemVerificationCommitmentInterval? ResolveVerificationCommitment(
      Commitment? commitment)
    {
      if (commitment == null) return null;

      var intervalName = commitment.Interval?.Trim();

      if (string.IsNullOrEmpty(intervalName))
        throw new InvalidOperationException("IXO verification commitment interval is required");

      var interval = _timeIntervalService.GetByNameOrNull(intervalName)
        ?? throw new InvalidOperationException($"IXO verification commitment interval '{intervalName}' is not supported");

      if (commitment.Count < 1 || commitment.Count > short.MaxValue)
        throw new InvalidOperationException($"IXO verification commitment count '{commitment.Count}' must be between 1 and {short.MaxValue}");

      return new SyncItemVerificationCommitmentInterval
      {
        Id = interval.Id,
        Count = (short)commitment.Count
      };
    }
    #endregion
  }
}
