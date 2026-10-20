using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Runtime.CompilerServices;
using Yoma.Core.Domain.Core.Interfaces;

namespace Yoma.Core.Domain.Core.Helpers
{
  /// <summary>
  /// Coordinates one background-job execution through application-stop checks and optional locking.
  /// The job still places stop checks at safe boundaries and drains active work before leaving this scope.
  /// This is not a transaction and does not cancel provider calls, roll back work or change lock TTL.
  /// Construction is restricted to Create and CreateWithLock so application lifetime is always required.
  /// </summary>
  public sealed class BackgroundJobExecutionScope : IAsyncDisposable
  {
    #region Class Variables
    private readonly ILogger? _logger;
    private readonly IHostApplicationLifetime _applicationLifetime;
    private readonly IDistributedLockService? _distributedLockService;
    private readonly string _processName;
    private string? _lockIdentifier;
    private bool _lockAcquired;
    private bool _disposed;
    #endregion

    #region Constructor
    private BackgroundJobExecutionScope(IHostApplicationLifetime applicationLifetime,
      IDistributedLockService? distributedLockService, ILogger? logger, string processName)
    {
      _logger = logger;
      _applicationLifetime = applicationLifetime ?? throw new ArgumentNullException(nameof(applicationLifetime));
      _distributedLockService = distributedLockService;
      _processName = processName;
    }
    #endregion

    #region Public Members
    /// <summary>
    /// Creates a lifecycle-only scope without acquiring or releasing a distributed lock.
    /// Application lifetime is required; logging is optional. Check stopping at safe boundaries
    /// and use the exception overload in the job's outer catch.
    /// </summary>
    public static BackgroundJobExecutionScope Create(IHostApplicationLifetime applicationLifetime,
      ILogger? logger = null, [CallerMemberName] string processName = "Unknown")
      => new(applicationLifetime, null, logger, processName);

    /// <summary>
    /// Creates a scope capable of one non-retrying lock attempt. Application lifetime and the lock
    /// service are required; logging is optional. Invoke TryAcquireLockAsync inside the job's try
    /// block; only an acquired lock is released on async disposal. The original caller name is retained.
    /// </summary>
    public static BackgroundJobExecutionScope CreateWithLock(IHostApplicationLifetime applicationLifetime,
      IDistributedLockService distributedLockService, ILogger? logger = null,
      [CallerMemberName] string processName = "Unknown")
      => new(applicationLifetime,
             distributedLockService ?? throw new ArgumentNullException(nameof(distributedLockService)),
             logger,
             processName);

    public bool IsStopping => _applicationLifetime.ApplicationStopping.IsCancellationRequested;

    /// <summary>
    /// Attempts the existing non-blocking lock once, checking application stop before and after
    /// successful acquisition. Disposal releases an acquired lock even if the second check throws.
    /// The scope has one owner; await acquisition and all workers before disposing it.
    /// </summary>
    public async Task<bool> TryAcquireLockAsync(string lockIdentifier, TimeSpan lockDuration)
    {
      ObjectDisposedException.ThrowIf(_disposed, this);
      if (_distributedLockService == null)
        throw new InvalidOperationException("This background-job scope was created without a distributed lock service");

      if (_lockIdentifier != null)
        throw new InvalidOperationException("A background-job scope supports only one lock acquisition attempt");

      ArgumentException.ThrowIfNullOrWhiteSpace(lockIdentifier);
      ThrowIfStopping();
      _lockIdentifier = lockIdentifier;
      _lockAcquired = await _distributedLockService.TryAcquireLockAsync(lockIdentifier, lockDuration, _processName);
      if (_lockAcquired) ThrowIfStopping();
      return _lockAcquired;
    }

    /// <summary>
    /// Call only before a new safe unit of work, never between a provider success and its local save.
    /// Cleanup and already-started durable units must remain able to finish when stopping.
    /// </summary>
    public void ThrowIfStopping()
    {
      ObjectDisposedException.ThrowIf(_disposed, this);
      _applicationLifetime.ApplicationStopping.ThrowIfCancellationRequested();
    }

    /// <summary>
    /// Call first in the job's existing outer catch. During shutdown, log when a logger was supplied
    /// and rethrow as cancellation with the original cause; otherwise return to normal error handling.
    /// Do not use inside a catch filter: the CLR treats exceptions thrown by filters as a false result.
    /// </summary>
    public void ThrowIfStopping(Exception exception)
    {
      ObjectDisposedException.ThrowIf(_disposed, this);
      ArgumentNullException.ThrowIfNull(exception);
      if (!IsStopping) return;

      if (_logger?.IsEnabled(LogLevel.Warning) == true)
        _logger.LogWarning("{Process} interrupted by application shutdown", _processName);

      throw new OperationCanceledException("Background job interrupted by application shutdown", exception,
        _applicationLifetime.ApplicationStopping);
    }

    /// <summary>
    /// Releases only this scope's acquired lock, once, without a cancellation check. Async disposal
    /// runs after the job's own finally blocks, including tracking or cache cleanup that may fail.
    /// Forced process termination can still prevent disposal; existing lock expiry remains necessary.
    /// </summary>
    public async ValueTask DisposeAsync()
    {
      if (_disposed) return;
      _disposed = true;
      if (_lockAcquired)
        await _distributedLockService!.ReleaseLockAsync(_lockIdentifier!, _processName);
    }
    #endregion
  }
}
