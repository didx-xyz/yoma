using Hangfire;
using Hangfire.Storage;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Transactions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.SSI.Services;

namespace Yoma.Core.Domain.Core.Services
{
  public class DownloadBackgroundService : IDownloadBackgroundService
  {
    #region Class Variables
    private readonly ILogger<SSIBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IDownloadService _downloadService;
    private readonly IOpportunityInfoService _opportunityInfoService;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly IBlobService _blobService;
    private readonly IUserService _userService;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly IExecutionStrategyService _executionStrategyService;
    private readonly IDistributedLockService _distributedLockService;
    #endregion

    #region Constructor
    public DownloadBackgroundService(ILogger<SSIBackgroundService> logger,
      IOptions<AppSettings> appSettings,
      IOptions<ScheduleJobOptions> scheduleJobOptions,
      IDownloadService downloadService,
      IOpportunityInfoService opportunityInfoService,
      IMyOpportunityService myOpportunityService,
      IBlobService blobService,
      IUserService userService,
      INotificationDeliveryService notificationDeliveryService,
      IExecutionStrategyService executionStrategyService,
      IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _downloadService = downloadService;
      _opportunityInfoService = opportunityInfoService;
      _myOpportunityService = myOpportunityService;
      _blobService = blobService;
      _userService = userService;
      _notificationDeliveryService = notificationDeliveryService;
      _executionStrategyService = executionStrategyService;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessSchedule()
    {
      const string lockIdentifier = "download_process_schedule";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DownloadScheduleProcessingMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessSchedule), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, System.Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing download schedule");

          var itemIdsToSkip = new List<Guid>();
          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _downloadService.ListPendingSchedule(_scheduleJobOptions.DownloadScheduleProcessingBatchSize, itemIdsToSkip);
            if (items.Count == 0) break;

            foreach (var item in items)
            {
              try
              {
                _logger.LogInformation("Processing download schedule for item with id '{id}'", item.Id);

                var type = Enum.Parse<DownloadScheduleType>(item.Type, true);

                //generate download files
                var files = new List<IFormFile>();

                object filter;
                string fileName;
                byte[] bytes;
                switch (type)
                {
                  case DownloadScheduleType.Opporunities:
                    filter = JsonConvert.DeserializeObject<OpportunitySearchFilterAdmin>(item.Filter)
                      ?? throw new InvalidOperationException("Failed to deserialize the filter");

                    ((OpportunitySearchFilterAdmin)filter).UnrestrictedQuery = true;

                    (fileName, bytes) = _opportunityInfoService.ExportToCSV((OpportunitySearchFilterAdmin)filter, false, true);

                    files.Add(FileHelper.FromByteArray(fileName, "text/csv", bytes));
                    break;

                  case DownloadScheduleType.MyOpportunityVerifications:
                    filter = JsonConvert.DeserializeObject<MyOpportunitySearchFilterAdmin>(item.Filter)
                      ?? throw new InvalidOperationException("Failed to deserialize the filter");

                    ((MyOpportunitySearchFilterAdmin)filter).UnrestrictedQuery = true;

                    (fileName, bytes) = _myOpportunityService.ExportToCSV((MyOpportunitySearchFilterAdmin)filter, false, true);

                    files.Add(FileHelper.FromByteArray(fileName, "text/csv", bytes));
                    break;

                  case DownloadScheduleType.MyOpportunityVerificationFiles:
                    filter = JsonConvert.DeserializeObject<MyOpportunitySearchFilterVerificationFiles>(item.Filter)
                      ?? throw new InvalidOperationException("Failed to deserialize the filter");

                    files.AddRange(await _myOpportunityService.DownloadVerificationFiles((MyOpportunitySearchFilterVerificationFiles)filter, null));
                    break;

                  default:
                    throw new NotImplementedException($"Download schedule type of '{item.Type}' not supported");
                }

                BlobObject? blobObject = null;
                try
                {
                  await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
                  {
                    using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                    //zip files and upload to blob storage
                    var downloadZipped = FileHelper.Zip(files, $"Download.zip");
                    blobObject = await _blobService.Create(downloadZipped, FileType.ZipArchive, BlobProvider.StorageType.Private);

                    //update schedule
                    item.FileId = blobObject.Id;
                    item.FileStorageType = blobObject.StorageType;
                    item.FileKey = blobObject.Key;
                    item.Status = DownloadScheduleStatus.Processed;
                    await _downloadService.UpdateSchedule(item);

                    scope.Complete();
                  });
                }
                catch //roll-back
                {
                  if (blobObject != null)
                    await _blobService.Delete(blobObject);

                  throw;
                }

                //send notification
                try
                {
                  if (blobObject == null)
                    throw new InvalidOperationException("Blob object is null");

                  var fileURL = _blobService.GetURL(blobObject.StorageType, blobObject.Key, blobObject.OriginalFileName, _appSettings.DownloadScheduleLinkExpirationHours * 60);

                  var user = _userService.GetById(item.UserId, false, false);

                  var recipients = new List<NotificationRecipient>
                  {
                    new() { Username = user.Username, PhoneNumber = user.PhoneNumber, Email = user.PhoneNumber, DisplayName = user.DisplayName }
                  };

                  var data = new NotificationDownload
                  {
                    DateStamp = DateTimeOffset.UtcNow,
                    FileName = blobObject.OriginalFileName,
                    FileURL = fileURL,
                    ExpirationHours = _appSettings.DownloadScheduleLinkExpirationHours
                  };

                  await _notificationDeliveryService.Send(NotificationType.Download, recipients, data);

                  _logger.LogInformation("Successfully send notification");
                }
                catch (Exception ex)
                {
                  _logger.LogError(ex, "Failed to send notification: {ErrorMessage}", ex.Message);
                }

                _logger.LogInformation("Processed download schedule for item with id '{id}'", item.Id);
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to proceess reward wallet creation for item with id '{id}'", item.Id);

                item.Status = DownloadScheduleStatus.Error;
                item.ErrorReason = ex.Message;
                await _downloadService.UpdateSchedule(item);

                itemIdsToSkip.Add(item.Id);
              }

              if (executeUntil <= DateTimeOffset.UtcNow) break;
            }
          }

          _logger.LogInformation("Processed download schedule");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessSchedule));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessSchedule));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "download_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessDeletion), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, System.Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing download schedule deletion");

          var itemIdsToSkip = new List<Guid>();
          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _downloadService.ListPendingDeletion(_scheduleJobOptions.DownloadScheduleDeletionBatchSize, itemIdsToSkip);
            if (items.Count == 0) break;

            foreach (var item in items)
            {
              try
              {
                _logger.LogInformation("Processing donwload schedule deletion for item with id '{id}'", item.Id);

                if (!item.FileId.HasValue)
                  throw new InvalidOperationException("File id is null");

                // since this is a background process, S3 deletion is safe to retry because AWS S3 deletion is idempotent  
                // and does not fail if the object is missing. Any DB rollback will be corrected in the next scheduled run,  
                // ensuring data consistency.
                await _executionStrategyService.ExecuteInExecutionStrategyAsync(async () =>
                {
                  using var scope = new TransactionScope(TransactionScopeOption.RequiresNew, TransactionScopeAsyncFlowOption.Enabled);

                  var fileId = item.FileId.Value;

                  item.Status = DownloadScheduleStatus.Deleted;
                  await _downloadService.UpdateSchedule(item);
                  await _blobService.Delete(fileId);

                  scope.Complete();
                });

                _logger.LogInformation("Processed download schedule deletion for item with id '{id}'", item.Id);
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to process donwload schedule deletion for item with id '{id}'", item.Id);

                item.Status = DownloadScheduleStatus.Error;
                item.ErrorReason = ex.Message;
                await _downloadService.UpdateSchedule(item);

                itemIdsToSkip.Add(item.Id);
              }

              if (executeUntil <= DateTimeOffset.UtcNow) break;
            }
          }

          _logger.LogInformation("Processed download schedule deletion");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessDeletion));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessDeletion));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion
  }
}
