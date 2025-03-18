using Hangfire;
using Hangfire.Storage;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Reflection;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Notification.Interfaces;
using Yoma.Core.Domain.Notification.Models;
using Yoma.Core.Domain.Entity.Events;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Services
{
  public class OrganizationBackgroundService : IOrganizationBackgroundService
  {
    #region Class Variables
    private readonly ILogger<OrganizationBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly IOrganizationService _organizationService;
    private readonly IOrganizationStatusService _organizationStatusService;
    private readonly INotificationDeliveryService _notificationDeliveryService;
    private readonly IUserService _userService;
    private readonly INotificationURLFactory _notificationURLFactory;
    private readonly IRepositoryBatchedValueContainsWithNavigation<Organization> _organizationRepository;
    private readonly IRepository<OrganizationDocument> _organizationDocumentRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IMediator _mediator;
    private static readonly OrganizationStatus[] Statuses_Declination = [OrganizationStatus.Inactive];
    private static readonly OrganizationStatus[] Statuses_Deletion = [OrganizationStatus.Declined];
    #endregion

    #region Constructor
    public OrganizationBackgroundService(ILogger<OrganizationBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IEnvironmentProvider environmentProvider,
        IOrganizationService organizationService,
        IOrganizationStatusService organizationStatusService,
        INotificationDeliveryService notificationDeliveryService,
        IUserService userService,
        INotificationURLFactory notificationURLFactory,
        IRepositoryBatchedValueContainsWithNavigation<Organization> organizationRepository,
        IRepository<OrganizationDocument> organizationDocumentRepository,
        IDistributedLockService distributedLockService,
        IMediator mediator)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _environmentProvider = environmentProvider;
      _organizationService = organizationService;
      _organizationStatusService = organizationStatusService;
      _notificationDeliveryService = notificationDeliveryService;
      _userService = userService;
      _notificationURLFactory = notificationURLFactory;
      _organizationRepository = organizationRepository;
      _organizationDocumentRepository = organizationDocumentRepository;
      _distributedLockService = distributedLockService;
      _mediator = mediator;
    }
    #endregion

    #region Public Memebers
    public async Task ProcessDeclination()
    {
      const string lockIdentifier = "organization_process_declination";
      var dateTimeNow = DateTimeOffset.UtcNow;
      var executeUntil = dateTimeNow.AddHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours);
      var lockDuration = executeUntil - dateTimeNow + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(ProcessDeclination), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing organization declination");

          var statusDeclinationIds = Statuses_Declination.Select(o => _organizationStatusService.GetByName(o.ToString()).Id).ToList();
          var statusDeclinedId = _organizationStatusService.GetByName(OrganizationStatus.Declined.ToString()).Id;

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _organizationRepository.Query(true).Where(o => statusDeclinationIds.Contains(o.StatusId) &&
             o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.OrganizationDeclinationIntervalInDays))
             .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OrganizationDeclinationBatchSize).ToList();
            if (items.Count == 0) break;

            var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

            foreach (var item in items)
            {
              item.CommentApproval = $"Auto-Declined due to being {string.Join("/", Statuses_Declination).ToLower()} for more than {_scheduleJobOptions.OrganizationDeclinationIntervalInDays} days";
              item.StatusId = statusDeclinedId;
              item.Status = OrganizationStatus.Declined;
              item.ModifiedByUserId = user.Id;
              _logger.LogInformation("Organization with id '{id}' flagged for declination", item.Id);
            }

            items = await _organizationRepository.Update(items);

            foreach (var item in items)
              await _mediator.Publish(new OrganizationStatusChangedEvent(item));

            var groupedOrganizations = items
                .SelectMany(org => org.Administrators ?? Enumerable.Empty<UserInfo>(), (org, admin) => new { Administrator = admin, Organization = org })
                .GroupBy(item => item.Administrator, item => item.Organization);

            var notificationType = Notification.NotificationType.Organization_Approval_Declined;
            foreach (var group in groupedOrganizations)
            {
              try
              {
                var recipients = new List<NotificationRecipient>
                        {
                            new() { Username = group.Key.Username, PhoneNumber = group.Key.PhoneNumber, Email = group.Key.Email, DisplayName = group.Key.DisplayName }
                        };

                var data = new NotificationOrganizationApproval
                {
                  Organizations = [.. group.Select(org => new NotificationOrganizationApprovalItem
                  {
                    Name = org.Name,
                    Comment = org.CommentApproval,
                    URL = _notificationURLFactory.OrganizationApprovalItemURL(notificationType, org.Id)
                  })]
                };

                await _notificationDeliveryService.Send(notificationType, recipients, data);

                _logger.LogInformation("Successfully sent notification");
              }
              catch (Exception ex)
              {
                _logger.LogError(ex, "Failed to send notification: {errorMessage}", ex.Message);
              }
            }

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }

          _logger.LogInformation("Processed organization declination");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}: {errorMessage}", nameof(ProcessDeclination), ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessDeclination), ex.Message);
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task ProcessDeletion()
    {
      const string lockIdentifier = "organization_process_deletion";
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
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          _logger.LogInformation("Processing organization deletion");

          var statusDeletionIds = Statuses_Deletion.Select(o => _organizationStatusService.GetByName(o.ToString()).Id).ToList();
          var statusDeletedId = _organizationStatusService.GetByName(OrganizationStatus.Deleted.ToString()).Id;

          while (executeUntil > DateTimeOffset.UtcNow)
          {
            var items = _organizationRepository.Query().Where(o => statusDeletionIds.Contains(o.StatusId) &&
                o.DateModified <= DateTimeOffset.UtcNow.AddDays(-_scheduleJobOptions.OrganizationDeletionIntervalInDays))
                .OrderBy(o => o.DateModified).Take(_scheduleJobOptions.OrganizationDeletionBatchSize).ToList();
            if (items.Count == 0) break;

            var user = _userService.GetByUsername(HttpContextAccessorHelper.GetUsernameSystem, false, false);

            foreach (var item in items)
            {
              item.StatusId = statusDeletedId;
              item.Status = OrganizationStatus.Deleted;
              item.ModifiedByUserId = user.Id;
              _logger.LogInformation("Organization with id '{id}' flagged for deletion", item.Id);
            }

            await _organizationRepository.Update(items);

            foreach (var item in items)
              await _mediator.Publish(new OrganizationStatusChangedEvent(item));

            if (executeUntil <= DateTimeOffset.UtcNow) break;
          }

          _logger.LogInformation("Processed organization deletion");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}: {errorMessage}", nameof(ProcessDeletion), ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(ProcessDeletion), ex.Message);
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }

    public async Task SeedLogoAndDocuments()
    {
      const string lockIdentifier = "organization_seed_logos_and_documents";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      if (!await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration))
      {
        _logger.LogInformation("{Process} is already running. Skipping execution attempt at {dateStamp}", nameof(SeedLogoAndDocuments), DateTimeOffset.UtcNow);
        return;
      }

      try
      {
        using (JobStorage.Current.GetConnection().AcquireDistributedLock(lockIdentifier, lockDuration))
        {
          _logger.LogInformation("Lock '{lockIdentifier}' acquired by {hostName} at {dateStamp}. Lock duration set to {lockDurationInMinutes} minutes",
            lockIdentifier, Environment.MachineName, DateTimeOffset.UtcNow, lockDuration.TotalMinutes);

          if (!_appSettings.TestDataSeedingEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
          {
            _logger.LogInformation("Organization logo and document seeding skipped for environment '{environment}'", _environmentProvider.Environment);
            return;
          }

          _logger.LogInformation("Processing organization logo and document seeding");

          await SeedLogo();
          await SeedDocuments();

          _logger.LogInformation("Processed organization logo and document seeding");
        }
      }
      catch (DistributedLockTimeoutException ex)
      {
        _logger.LogError(ex, "Could not acquire distributed lock for {process}: {errorMessage}", nameof(SeedLogoAndDocuments), ex.Message);
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(SeedLogoAndDocuments), ex.Message);
      }
      finally
      {
        await _distributedLockService.ReleaseLockAsync(lockIdentifier);
      }
    }
    #endregion

    #region Private Members
    private async Task SeedLogo()
    {
      var items = _organizationRepository.Query(true).Where(o => !o.LogoId.HasValue).ToList();
      if (items.Count == 0) return;

      var resourcePath = "Yoma.Core.Domain.Entity.SampleBlobs.sample_logo.png";
      var assembly = Assembly.GetExecutingAssembly();
      using var resourceStream = assembly.GetManifestResourceStream(resourcePath)
          ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found");

      byte[] resourceBytes;
      using (var memoryStream = new MemoryStream())
      {
        resourceStream.CopyTo(memoryStream);
        resourceBytes = memoryStream.ToArray();
      }

      var fileName = string.Join('.', resourcePath.Split('.').Reverse().Take(2).Reverse());
      var fileExtension = Path.GetExtension(fileName)[1..];

      foreach (var item in items)
        await _organizationService.UpdateLogo(item.Id, FileHelper.FromByteArray(fileName, $"image/{fileExtension}", resourceBytes), false);
    }

    private async Task SeedDocuments()
    {
      var items = _organizationRepository.Query(true).Where(o => !_organizationDocumentRepository.Query().Any(od => od.OrganizationId == o.Id)).ToList();
      if (items.Count == 0) return;

      var myItemsEducation = items.Where(
          o => o.ProviderTypes != null
          && o.ProviderTypes.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Education.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null).ToList();

      var myItemsMarketplace = items.Where(
          o => o.ProviderTypes != null
          && o.ProviderTypes.SingleOrDefault(o => string.Equals(o.Name, OrganizationProviderType.Marketplace.ToString(), StringComparison.InvariantCultureIgnoreCase)) != null).ToList();

      var resourcePath = "Yoma.Core.Domain.Entity.SampleBlobs.sample.pdf";
      var assembly = Assembly.GetExecutingAssembly();
      using var resourceStream = assembly.GetManifestResourceStream(resourcePath)
          ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found");

      byte[] resourceBytes;
      using (var memoryStream = new MemoryStream())
      {
        resourceStream.CopyTo(memoryStream);
        resourceBytes = memoryStream.ToArray();
      }

      var fileName = string.Join('.', resourcePath.Split('.').Reverse().Take(2).Reverse());
      var fileExtension = Path.GetExtension(fileName)[1..];

      foreach (var item in items)
        await _organizationService.AddDocuments(
            item.Id, OrganizationDocumentType.Registration,
            [FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes)], false);

      foreach (var item in myItemsEducation)
        await _organizationService.AddDocuments(
            item.Id, OrganizationDocumentType.EducationProvider,
            [FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes)], false);

      foreach (var item in myItemsMarketplace)
        await _organizationService.AddDocuments(
            item.Id, OrganizationDocumentType.Business,
            [FileHelper.FromByteArray(fileName, $"application/{fileExtension}", resourceBytes)], false);
    }
    #endregion
  }
}
