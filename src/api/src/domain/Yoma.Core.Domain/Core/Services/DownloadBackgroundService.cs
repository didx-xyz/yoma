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
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

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

              var zipFileNameSuffix = string.Empty;
              var notificationMessage = string.Empty;
              string fileName;
              byte[] bytes;
              switch (type)
              {
                case DownloadScheduleType.Opporunities:
                  var filterOpporunities = JsonConvert.DeserializeObject<OpportunitySearchFilterAdmin>(item.Filter)
                    ?? throw new InvalidOperationException("Failed to deserialize the filter");

                  filterOpporunities.UnrestrictedQuery = true;

                  (fileName, bytes) = _opportunityInfoService.ExportToCSV(filterOpporunities, false, true);

                  files.Add(FileHelper.FromByteArray(fileName, "text/csv", bytes));

                  notificationMessage = "Opportunities CSV Export";
                  break;

                case DownloadScheduleType.MyOpportunityVerifications:
                  var filterMyOpportunityVerifications = JsonConvert.DeserializeObject<MyOpportunitySearchFilterAdmin>(item.Filter)
                    ?? throw new InvalidOperationException("Failed to deserialize the filter");

                  filterMyOpportunityVerifications.UnrestrictedQuery = true;

                  (fileName, bytes) = _myOpportunityService.ExportToCSV(filterMyOpportunityVerifications, false, true);

                  files.Add(FileHelper.FromByteArray(fileName, "text/csv", bytes));

                  notificationMessage = "Opportunity Completions CSV Export";
                  break;

                case DownloadScheduleType.MyOpportunityVerificationFiles:
                  var filterMyOpportunityVerificationFiles = JsonConvert.DeserializeObject<MyOpportunitySearchFilterVerificationFilesAdmin>(item.Filter)
                    ?? throw new InvalidOperationException("Failed to deserialize the filter");

                  //completedVerificationsOnly is serilaized

                  var result = await _myOpportunityService.DownloadVerificationFiles(filterMyOpportunityVerificationFiles, false);
                  if (result.Files != null && result.Files.Count > 0) files.AddRange(result.Files);

                  notificationMessage = $"Opportunity Completion Uploads Export for {result.OpportunityTitle}";

                  if (filterMyOpportunityVerificationFiles.PageNumber.HasValue) zipFileNameSuffix = $"-Batch-{filterMyOpportunityVerificationFiles.PageNumber.Value}";
                  break;

                default:
                  throw new NotImplementedException($"Download schedule type of '{item.Type}' not supported");
              }

              BlobObject? blobObject = null;
              try
              {
                if (files.Count > 0)
                {
                  //zip files and upload to blob storage; TransactionScope not used as the upload can take long, causing an aborted scope or connection
                  //if schedule update fails, the blob object and db entries are deleted
                  var downloadZipped = FileHelper.Zip(files, $"Download{zipFileNameSuffix}.zip");
                  blobObject = await _blobService.Create(downloadZipped, FileType.ZipArchive, BlobProvider.StorageType.Private);

                  //update schedule
                  item.FileId = blobObject.Id;
                  item.FileStorageType = blobObject.StorageType;
                  item.FileKey = blobObject.Key;
                }

                item.Status = DownloadScheduleStatus.Processed;
                await _downloadService.UpdateSchedule(item);
              }
              catch //roll-back
              {
                if (blobObject != null)
                  await _blobService.Delete(blobObject.Id);

                throw;
              }
              finally
              {
                //dispose file streams to release memory (especially important in constrained environments)
                foreach (var file in files)
                {
                  try
                  {
                    file.OpenReadStream().Dispose(); //ensure stream is closed
                  }
                  catch { }
                }
              }

              //send notification
              try
              {
                var user = _userService.GetById(item.UserId, false, false);

                var recipients = new List<NotificationRecipient>
                  {
                    new() { Username = user.Username, PhoneNumber = user.PhoneNumber, Email = user.Email, DisplayName = user.DisplayName }
                  };

                var data = new NotificationDownload
                {
                  DateStamp = DateTimeOffset.UtcNow,
                  FileName = blobObject?.OriginalFileName,
                  FileURL = blobObject == null ? null : _blobService.GetURL(blobObject.StorageType, blobObject.Key, blobObject.OriginalFileName, _appSettings.DownloadScheduleLinkExpirationHours * 60),
                  ExpirationHours = _appSettings.DownloadScheduleLinkExpirationHours,
                  Comment = notificationMessage
                };

                await _notificationDeliveryService.Send(NotificationType.Download, recipients, data);

                _logger.LogInformation("Successfully sent notification");
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
              }

              _logger.LogInformation("Processed download schedule for item with id '{id}'", item.Id);
            }
            catch (Exception ex)
            {
              _logger.LogError(ex, "Failed to process download schedule for item with id '{id}': {errorMessage}", item.Id, ex.Message);

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
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}: {errorMessage}", nameof(ProcessSchedule), ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessSchedule), ex.Message);
      }
      finally
      {
        if (lockAcquired) await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "download_process_deletion";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);
      var lockAcquired = false;

      try
      {
        lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration);
        if (!lockAcquired) return;

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
              _logger.LogInformation("Processing download schedule deletion for item with id '{id}'", item.Id);

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
              _logger.LogError(ex, "Failed to process download schedule deletion for item with id '{id}': {errorMessage}", item.Id, ex.Message);

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
