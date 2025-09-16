using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.BlobProvider.Interfaces;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.BlobProvider.Services
{
  public class ResumableUploadStoreBackgroundService : IResumableUploadStoreBackgroundService
  {
    #region Class Variables
    private readonly ILogger<ResumableUploadStoreBackgroundService> _logger;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IResumableUploadStore _resumableUploadStore;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public ResumableUploadStoreBackgroundService(
      ILogger<ResumableUploadStoreBackgroundService> logger,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IResumableUploadStore resumableUploadStore,
      IDistributedLockService distributedLockService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _scheduleJobOptions = scheduleJobOptions?.Value ?? throw new ArgumentNullException(nameof(scheduleJobOptions));
      _resumableUploadStore = resumableUploadStore ?? throw new ArgumentNullException(nameof(resumableUploadStore));
      _distributedLockService = distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService));
    }
    #endregion

    #region Public Members
    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "resumable_upload_store_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

        _logger.LogInformation("Processing resumable upload deletion");

        var itemIdsToSkip = new List<string>();
        while (executeUntil > DateTimeOffset.UtcNow)
        {
          var uploadIds = await _resumableUploadStore.ListPendingDeletion(_scheduleJobOptions.ResumableUploadStoreBatchSize, itemIdsToSkip);
          if (uploadIds.Count == 0) break;

          foreach (var uploadId in uploadIds)
          {
            try
            {
              _logger.LogInformation("Processing resumable upload deletion for upload with id '{upload}'", uploadId);

              await _resumableUploadStore.Delete(uploadId);
            }
            catch (Exception ex)
            {
              _logger.LogError(ex, "Failed to process resumable upload deletion for upload with id '{upload}': {errorMessage}", uploadId, ex.Message);

              itemIdsToSkip.Add(uploadId);
            }

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }
          _logger.LogInformation("Processed resumable upload deletion");
        }
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessDeletion), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
