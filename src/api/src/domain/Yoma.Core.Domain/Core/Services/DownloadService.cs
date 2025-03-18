using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Interfaces.Lookups;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Reward.Services;

namespace Yoma.Core.Domain.Core.Services
{
  public class DownloadService : IDownloadService
  {
    #region Class Variables
    private readonly ILogger<RewardService> _logger;
    private readonly AppSettings _appSettings;
    private readonly IDownloadScheduleStatusService _downloadScheduleStatusService;
    private readonly IRepositoryBatched<DownloadSchedule> _downloadScheduleRepository;
    #endregion

    #region Constructor
    public DownloadService(ILogger<RewardService> logger,
        IOptions<AppSettings> appSettings,
        IDownloadScheduleStatusService downloadScheduleStatusService,
        IRepositoryBatched<DownloadSchedule> downloadScheduleRepository)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _downloadScheduleStatusService = downloadScheduleStatusService;
      _downloadScheduleRepository = downloadScheduleRepository;
    }
    #endregion

    #region Public Members
    public async Task Schedule(Guid userId, DownloadScheduleType type, object filter)
    {
      if (userId == Guid.Empty) //used internally by other services which validates the user id prior to invocation
        throw new ArgumentNullException(nameof(userId));

      ArgumentNullException.ThrowIfNull(filter, nameof(filter));

      var statusPendingId = _downloadScheduleStatusService.GetByName(DownloadScheduleStatus.Pending.ToString()).Id;

      var filterHash = HashHelper.ComputeSHA256Hash(filter);

      var existingItem = _downloadScheduleRepository.Query().SingleOrDefault(
        o => o.UserId == userId && o.Type == type.ToString() && o.FilterHash == filterHash && o.StatusId == statusPendingId);

      if (existingItem != null)
      {
        _logger.LogInformation("Scheduling of download skipped: Already '{status}' for user id '{userId}', type '{type}' and specified filter", existingItem.StatusId, userId, type);
        return;
      }

      var item = new DownloadSchedule { UserId = userId, Type = type.ToString(), Filter = JsonConvert.SerializeObject(filter), FilterHash = filterHash, StatusId = statusPendingId };
      await _downloadScheduleRepository.Create(item);
    }

    public List<DownloadSchedule> ListPendingSchedule(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusPendingId = _downloadScheduleStatusService.GetByName(DownloadScheduleStatus.Pending.ToString()).Id;

      var query = _downloadScheduleRepository.Query().Where(o => o.StatusId == statusPendingId);

      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return results;
    }

    public List<DownloadSchedule> ListPendingDeletion(int batchSize, List<Guid> idsToSkip)
    {
      ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(batchSize, default, nameof(batchSize));

      var statusProcessed = _downloadScheduleStatusService.GetByName(DownloadScheduleStatus.Processed.ToString()).Id;

      var query = _downloadScheduleRepository.Query().Where(o => o.StatusId == statusProcessed && o.FileId.HasValue &&
        o.DateModified <= DateTimeOffset.UtcNow.AddHours(-_appSettings.DownloadScheduleLinkExpirationHours));

      if (idsToSkip != null && idsToSkip.Count != 0)
        query = query.Where(o => !idsToSkip.Contains(o.Id));

      var results = query.OrderBy(o => o.DateModified).Take(batchSize).ToList();

      return results;
    }

    public async Task UpdateSchedule(DownloadSchedule item)
    {
      ArgumentNullException.ThrowIfNull(item, nameof(item));

      UpdateTransactionProcess(item);

      await _downloadScheduleRepository.Update(item);
    }

    public async Task UpdateSchedule(List<DownloadSchedule> items)
    {
      if (items == null || items.Count == 0) return;

      items.ForEach(o => UpdateTransactionProcess(o));

      await _downloadScheduleRepository.Update(items);
    }
    #endregion

    #region Private Members
    private void UpdateTransactionProcess(DownloadSchedule item)
    {
      var statusId = _downloadScheduleStatusService.GetByName(item.Status.ToString()).Id;
      item.StatusId = statusId;

      switch (item.Status)
      {
        case DownloadScheduleStatus.Processed:
          //fileId can be null if the download does not contain any files (see DownloadBackgroundService.ProcessSchedule)
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        case DownloadScheduleStatus.Error:
          if (string.IsNullOrEmpty(item.ErrorReason))
            throw new ArgumentNullException(nameof(item), $"{nameof(item.ErrorReason)} required");

          item.ErrorReason = item.ErrorReason?.Trim();
          item.RetryCount = (byte?)(item.RetryCount + 1) ?? 0; //1st attempt not counted as a retry

          //retry attempts specified and exceeded (-1: infinite retries)
          if (_appSettings.DownloadScheduleMaximumRetryAttempts == 0 ||
            _appSettings.DownloadScheduleMaximumRetryAttempts > 0 && item.RetryCount > _appSettings.DownloadScheduleMaximumRetryAttempts) break;

          item.StatusId = _downloadScheduleStatusService.GetByName(DownloadScheduleStatus.Pending.ToString()).Id;
          item.Status = DownloadScheduleStatus.Pending;
          break;

        case DownloadScheduleStatus.Deleted:
          item.FileId = null;
          item.ErrorReason = null;
          item.RetryCount = null;
          break;

        default:
          throw new InvalidOperationException($"Status of '{item.Status}' not supported");
      }
    }
    #endregion
  }
}
