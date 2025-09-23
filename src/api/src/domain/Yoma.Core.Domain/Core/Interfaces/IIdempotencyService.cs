namespace Yoma.Core.Domain.Core.Interfaces
{
  /// <summary>
  /// Distributed idempotency helper. Stores a volatile marker (e.g. in Redis) with the configured TTL.
  /// If the key already exists => duplicate. If it is created now => first execution.
  /// Keys auto-expire; no manual cleanup required.
  /// </summary>
  public interface IIdempotencyService
  {
    /// <summary>
    /// Attempts to create the idempotency key with the configured TTL.
    /// Returns true if this is the first observation (key created).
    /// Returns false if the key already existed (duplicate).
    /// </summary>
    Task<bool> TryCreateAsync(string key);
  }
}
