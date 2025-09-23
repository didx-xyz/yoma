using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.Runtime.CompilerServices;
using System.Text;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;

namespace Yoma.Core.Domain.Core.Services
{
  public sealed class IdempotencyService : IIdempotencyService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly ILogger<IdempotencyService> _logger;
    private const string IdempotencyIdentifier_Prefix = "yoma.core.api:idemp";
    #endregion

    #region Constructor
    public IdempotencyService(
      ILogger<IdempotencyService> logger,
      IConnectionMultiplexer connectionMultiplexer,
      IOptions<AppSettings> appSettings)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _connectionMultiplexer = connectionMultiplexer ?? throw new ArgumentNullException(nameof(connectionMultiplexer));
      _appSettings = appSettings.Value ?? throw new ArgumentNullException(nameof(appSettings));

      if (_appSettings.IdempotencyKeyExpirationInSeconds <= 0)
        throw new InvalidOperationException(
          $"Configuration error: {nameof(AppSettings.IdempotencyKeyExpirationInSeconds)} must be greater than 0 (current: {_appSettings.IdempotencyKeyExpirationInSeconds}).");
    }
    #endregion

    #region Public Members
    public async Task<bool> TryCreateAsync(string key, [CallerMemberName] string processName = "Unknown")
    {
      ArgumentException.ThrowIfNullOrWhiteSpace(key);
      key = key.Trim();

      var ttlSeconds = _appSettings.IdempotencyKeyExpirationInSeconds;
      var ttl = TimeSpan.FromSeconds(ttlSeconds);

      var redisKey = $"{IdempotencyIdentifier_Prefix}:{key}";
      var db = _connectionMultiplexer.GetDatabase();

      var value = Encoding.UTF8.GetBytes($"created_by: {System.Environment.MachineName}");
      var created = await db.StringSetAsync(redisKey, value, ttl, When.NotExists);

      if (created)
        _logger.LogInformation("Idempotency key created by {hostName} at {timestamp} for process {process}: {key} (ttl={ttlSeconds}s)",
          System.Environment.MachineName, DateTimeOffset.UtcNow, redisKey, processName, ttlSeconds);
      else
        _logger.LogInformation("Duplicate idempotency key detected by {hostName} at {timestamp} for process {process}: {key}",
          System.Environment.MachineName, DateTimeOffset.UtcNow, processName, redisKey);

      return created;
    }
    #endregion
  }
}
