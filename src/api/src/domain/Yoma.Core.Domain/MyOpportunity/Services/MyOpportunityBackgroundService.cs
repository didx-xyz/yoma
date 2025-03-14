using Hangfire;
using Hangfire.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;
using System.Reflection;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;

namespace Yoma.Core.Domain.MyOpportunity.Services
{
  public class MyOpportunityBackgroundService : IMyOpportunityBackgroundService
  {
    #region Class Variables
    private readonly ILogger<MyOpportunityBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly IMyOpportunityVerificationStatusService _myOpportunityVerificationStatusService;
    private readonly IMyOpportunityActionService _myOpportunityActionService;
    private readonly IOpportunityService _opportunityService;
    private readonly INotificationURLFactory _notificationURLFactory;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly IRepositoryBatchedWithNavigation<Models.MyOpportunity> _myOpportunityRepository;
    private readonly IRepository<MyOpportunityVerification> _myOpportunityVerificationRepository;
    private readonly IDistributedLockService _distributedLockService;

    private static readonly VerificationStatus[] Statuses_Rejectable = [VerificationStatus.Pending];
    #endregion

    #region Constructor
    public MyOpportunityBackgroundService(ILogger<MyOpportunityBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IEnvironmentProvider environmentProvider,
        IMyOpportunityService myOpportunityService,
        IMyOpportunityVerificationStatusService myOpportunityVerificationStatusService,
        IMyOpportunityActionService myOpportunityActionService,
        IOpportunityService opportunityService,
        INotificationURLFactory notificationURLFactory,
        INotificationDeliveryService notificationDeliveryService,
        IRepositoryBatchedWithNavigation<Models.MyOpportunity> myOpportunityRepository,
        IRepository<MyOpportunityVerification> myOpportunityVerificationRepository,
        IDistributedLockService distributedLockService)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _environmentProvider = environmentProvider;
      _myOpportunityService = myOpportunityService;
      _myOpportunityVerificationStatusService = myOpportunityVerificationStatusService;
      _myOpportunityActionService = myOpportunityActionService;
      _opportunityService = opportunityService;
      _notificationURLFactory = notificationURLFactory;
      _notificationDeliveryService = notificationDeliveryService;
      _myOpportunityRepository = myOpportunityRepository;
      _myOpportunityVerificationRepository = myOpportunityVerificationRepository;
      _distributedLockService = distributedLockService;
    }
    #endregion

    #region Public Members
    public async Task ProcessVerificationRejection()
    {
      const string lockIdentifier = "myopportunity_process_verification_rejection";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessVerificationRejection), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, System.Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing 'my' opportunity verification rejection");

          var statusRejectedId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Rejected.ToString()).Id;
          var statusRejectableIds = Statuses_Rejectable.Select(o => _myOpportunityVerificationStatusService.GetByName(o.ToString()).Id).ToList();

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _myOpportunityRepository.Query().Where(o => o.VerificationStatusId.HasValue && statusRejectableIds.Contains(o.VerificationStatusId.Value) &&
              o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.MyOpportunityRejectionIntervalInDays))
              .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OpportunityDeletionBatchSize).ToList();
            if (items.Count == 0) break;

            foreach (var item in items)
            {
              item.CommentVerification = $"Auto-Rejected due to being {string.Join("/", Statuses_Rejectable).ToLower()} for more than {_scheduleJobOptions.MyOpportunityRejectionIntervalInDays} days";
              item.VerificationStatusId = statusRejectedId;
              _logger.LogInformation("'My' opportunity with id '{id}' flagged for verification rejection", item.Id);
            }

            items = await _myOpportunityRepository.Update(items);

            var groupedMyOpportunities = items.GroupBy(item => new { item.Username, item.UserEmail, item.UserPhoneNumber, item.UserDisplayName });

            var notificationType = NotificationType.Opportunity_Verification_Rejected;
            foreach (var group in groupedMyOpportunities)
            {
              try
              {
                var recipients = new List<NotificationRecipient>
                {
                  new() { Username = group.Key.Username, PhoneNumber = group.Key.UserPhoneNumber, Email = group.Key.UserEmail, DisplayName = group.Key.UserDisplayName }
                };

                var data = new NotificationOpportunityVerification
                {
                  YoIDURL = _notificationURLFactory.OpportunityVerificationYoIDURL(notificationType),
                  Opportunities = []
                };

                foreach (var myOp in group)
                {
                  data.Opportunities.Add(new NotificationOpportunityVerificationItem
                  {
                    Title = myOp.OpportunityTitle,
                    DateStart = myOp.DateStart,
                    DateEnd = myOp.DateEnd,
                    Comment = myOp.CommentVerification,
                    URL = _notificationURLFactory.OpportunityVerificationItemURL(notificationType, myOp.OpportunityId, null),
                    ZltoReward = myOp.ZltoReward,
                    YomaReward = myOp.YomaReward
                  });
                }

                await _notificationDeliveryService.Send(notificationType, recipients, data);

                _logger.LogInformation("Successfully send notification");
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to send notification: {ErrorMessage}", ex.Message);
              }
            }

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }

          _logger.LogInformation("Processed 'my' opportunity verification rejection");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(ProcessVerificationRejection));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(ProcessVerificationRejection));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task SeedPendingVerifications()
    {
      const string lockIdentifier = "myopportunity_seed_pending_verifications]";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(SeedPendingVerifications), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, System.Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          if (!_appSettings.TestDataSeedingEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
          {
            _logger.LogInformation("Pending verification seeding skipped for environment '{environment}'", _environmentProvider.Environment);
            return;
          }

          _logger.LogInformation("Processing pending verification seeding seeding");

          var actionVerificationId = _myOpportunityActionService.GetByName(Action.Verification.ToString()).Id;
          var verificationStatusPendingId = _myOpportunityVerificationStatusService.GetByName(VerificationStatus.Pending.ToString()).Id;

          var items = _myOpportunityRepository.Query(true).Where(
              o => !_myOpportunityVerificationRepository.Query().Any(mv => mv.MyOpportunityId == o.Id)
              && o.ActionId == actionVerificationId && o.VerificationStatusId == verificationStatusPendingId).ToList();

          await SeedPendingVerifications(items);

          _logger.LogInformation("Processed pending verification seeding");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}", nameof(SeedPendingVerifications));
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}", nameof(SeedPendingVerifications));
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private async Task SeedPendingVerifications(List<Models.MyOpportunity> items)
    {
      if (items.Count == 0) return;

      foreach (var item in items)
      {
        try
        {
          var opportunity = _opportunityService.GetById(item.OpportunityId, true, true, false);
          if (opportunity.VerificationTypes == null || opportunity.VerificationTypes.Count == 0) continue;

          var request = new MyOpportunityRequestVerify
          {
            DateStart = item.DateStart,
            DateEnd = item.DateStart
          };

          foreach (var verificationType in opportunity.VerificationTypes)
          {
            var assembly = Assembly.GetExecutingAssembly();

            switch (verificationType.Type)
            {
              case VerificationType.FileUpload:
                var resourcePathCertificate = "Yoma.Core.Domain.MyOpportunity.SampleBlobs.sample_certificate.pdf";

                using (var resourceStream = assembly.GetManifestResourceStream(resourcePathCertificate))
                {
                  if (resourceStream == null)
                    throw new InvalidOperationException($"Embedded resource '{resourcePathCertificate}' not found");

                  byte[] resourceBytes;
                  using (var memoryStream = new MemoryStream())
                  {
                    resourceStream.CopyTo(memoryStream);
                    resourceBytes = memoryStream.ToArray();
                  }

                  var fileName = string.Join('.', resourcePathCertificate.Split('.').Reverse().Take(2).Reverse());
                  var fileExtension = Path.GetExtension(fileName)[1..];

                  request.Certificate = FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes);
                }

                break;

              case VerificationType.Picture:
                var resourcePathPicture = "Yoma.Core.Domain.MyOpportunity.SampleBlobs.sample_photo.png";

                using (var resourceStream = assembly.GetManifestResourceStream(resourcePathPicture))
                {
                  if (resourceStream == null)
                    throw new InvalidOperationException($"Embedded resource '{resourcePathPicture}' not found");

                  byte[] resourceBytes;
                  using (var memoryStream = new MemoryStream())
                  {
                    resourceStream.CopyTo(memoryStream);
                    resourceBytes = memoryStream.ToArray();
                  }

                  var fileName = string.Join('.', resourcePathPicture.Split('.').Reverse().Take(2).Reverse());
                  var fileExtension = Path.GetExtension(fileName)[1..];

                  request.Picture = FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes);
                }
                break;

              case VerificationType.VoiceNote:
                var resourcePathVoiceNote = "Yoma.Core.Domain.MyOpportunity.SampleBlobs.sample_voice_note.wav";

                using (var resourceStream = assembly.GetManifestResourceStream(resourcePathVoiceNote))
                {
                  if (resourceStream == null)
                    throw new InvalidOperationException($"Embedded resource '{resourcePathVoiceNote}' not found");

                  byte[] resourceBytes;
                  using (var memoryStream = new MemoryStream())
                  {
                    resourceStream.CopyTo(memoryStream);
                    resourceBytes = memoryStream.ToArray();
                  }

                  var fileName = string.Join('.', resourcePathVoiceNote.Split('.').Reverse().Take(2).Reverse());
                  var fileExtension = Path.GetExtension(fileName)[1..];

                  request.VoiceNote = FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes);
                }
                break;

              case VerificationType.Video:
                var resourcePathVideo = "Yoma.Core.Domain.MyOpportunity.SampleBlobs.sample_video.mp4";

                using (var resourceStream = assembly.GetManifestResourceStream(resourcePathVideo))
                {
                  if (resourceStream == null)
                    throw new InvalidOperationException($"Embedded resource '{resourcePathVideo}' not found");

                  byte[] resourceBytes;
                  using (var memoryStream = new MemoryStream())
                  {
                    resourceStream.CopyTo(memoryStream);
                    resourceBytes = memoryStream.ToArray();
                  }

                  var fileName = string.Join('.', resourcePathVideo.Split('.').Reverse().Take(2).Reverse());
                  var fileExtension = Path.GetExtension(fileName)[1..];

                  request.Video = FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes);
                }
                break;

              case VerificationType.Location:
                request.Geometry = new Geometry
                {
                  Type = SpatialType.Point,
                  Coordinates = [[-0.09394821166991196, 51.50525376803295, 0]]
                };
                break;

              default:
                throw new InvalidOperationException($"Unknown / unsupported '{nameof(VerificationType)}' of '{verificationType.Type}'");
            }
          }

          await _myOpportunityService.PerformActionSendForVerificationManual(item.UserId, item.OpportunityId, request, true);

        }
        catch (FluentValidation.ValidationException ex)
        {
          _logger.LogError(ex, "Pending verification seeding validation failed. Seeding skipped / no longer seed-able for item with id '{id}'", item.Id);
        }
        catch (ValidationException ex)
        {
          _logger.LogError(ex, "Pending verification seeding validation failed. Seeding skipped / no longer seed-able for item with id '{id}'", item.Id);
        }
      }
      #endregion
    }
  }
}
