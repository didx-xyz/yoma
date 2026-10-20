using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Reflection;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Domain.Entity.Services
{
  public class UserBackgroundService : IUserBackgroundService
  {
    #region Class Variables
    private readonly ILogger<UserBackgroundService> _logger;
    private readonly AppSettings _appSettings;
    private readonly ScheduleJobOptions _scheduleJobOptions;
    private readonly IEnvironmentProvider _environmentProvider;
    private readonly IUserService _userService;
    private readonly IRepositoryValueContainsWithNavigation<User> _userRepository;
    private readonly IDistributedLockService _distributedLockService;
    private readonly IHostApplicationLifetime _applicationLifetime;
    #endregion

    #region Constructor
    public UserBackgroundService(ILogger<UserBackgroundService> logger,
        IOptions<AppSettings> appSettings,
        IOptions<ScheduleJobOptions> scheduleJobOptions,
        IEnvironmentProvider environmentProvider,
        IUserService userService,
        IRepositoryValueContainsWithNavigation<User> userRepository,
        IDistributedLockService distributedLockService,
        IHostApplicationLifetime applicationLifetime)
    {
      _logger = logger;
      _appSettings = appSettings.Value;
      _scheduleJobOptions = scheduleJobOptions.Value;
      _environmentProvider = environmentProvider;
      _userService = userService;
      _userRepository = userRepository;
      _distributedLockService = distributedLockService;
      _applicationLifetime = applicationLifetime ?? throw new ArgumentNullException(nameof(applicationLifetime));
    }
    #endregion

    #region Public Members
    public async Task SeedPhotos()
    {
      const string lockIdentifier = "user_seed_photos";
      var lockDuration = TimeSpan.FromHours(_scheduleJobOptions.DefaultScheduleMaxIntervalInHours) + TimeSpan.FromMinutes(_scheduleJobOptions.DistributedLockDurationBufferInMinutes);

      await using var job = BackgroundJobExecutionScope.CreateWithLock(_applicationLifetime, _distributedLockService, _logger);

      try
      {
        if (!await job.TryAcquireLockAsync(lockIdentifier, lockDuration)) return;

        if (!_appSettings.TestDataSeedingEnvironmentsAsEnum.HasFlag(_environmentProvider.Environment))
        {
          if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("User image seeding seeding skipped for environment '{environment}'", _environmentProvider.Environment);
          return;
        }

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processing user image seeding");

        var items = _userRepository.Query().Where(o => !o.PhotoId.HasValue).ToList();
        await SeedPhotos(items);

        if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Processed user image seeding");
      }
      catch (Exception ex)
      {
        job.ThrowIfStopping(ex);

        if (_logger.IsEnabled(LogLevel.Error)) _logger.LogError(ex, "Failed to execute {process}: {errorMessage}", nameof(SeedPhotos), ex.Message);
      }
    }
    #endregion

    #region Private Members
    private async Task SeedPhotos(List<User> items)
    {
      if (items.Count == 0) return;

      var resourcePath = "Yoma.Core.Domain.Entity.SampleBlobs.sample_photo.png";
      var assembly = Assembly.GetExecutingAssembly();
      using var resourceStream = assembly.GetManifestResourceStream(resourcePath)
          ?? throw new InvalidOperationException($"Embedded resource '{resourcePath}' not found");

      byte[] resourceBytes;
      await using (var memoryStream = new MemoryStream())
      {
        resourceStream.CopyTo(memoryStream);
        resourceBytes = memoryStream.ToArray();
      }

      var fileName = string.Join('.', resourcePath.Split('.').Reverse().Take(2).Reverse());
      var fileExtension = Path.GetExtension(fileName)[1..];

      foreach (var item in items)
      {
        _applicationLifetime.ApplicationStopping.ThrowIfCancellationRequested();
        await _userService.UpsertPhoto(item.Username, FileHelper.FromByteArray(fileName, $"image/{fileExtension}", resourceBytes));
      }
    }
    #endregion
  }
}
