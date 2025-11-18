namespace Yoma.Core.Domain.Core.Interfaces
{
  /// <summary>
  /// Provides a scoped, sequential buffer for deferred execution of actions
  /// after a request or operation completes. 
  /// 
  /// Notes:
  /// • The service is <b>not thread-safe</b> and must be registered as <b>scoped</b>.
  /// • Actions are executed in the order they were enqueued.
  /// • Exceptions are logged but do not stop subsequent actions from running.
  /// </summary>
  public interface IDelayedExecutionService
  {
    /// <summary>
    /// Enqueues an asynchronous action for deferred execution.
    /// </summary>
    /// <param name="action">The asynchronous action to execute later.</param>
    /// <param name="name">Optional descriptive name for logging.</param>
    /// <param name="meta">Optional metadata string for additional logging context.</param>
    void Enqueue(Func<Task> action, string? name = null, string? meta = null);

    /// <summary>
    /// Enqueues a synchronous action for deferred execution.
    /// </summary>
    /// <param name="action">The synchronous action to execute later.</param>
    /// <param name="name">Optional descriptive name for logging.</param>
    /// <param name="meta">Optional metadata string for additional logging context.</param>
    void Enqueue(Action action, string? name = null, string? meta = null);

    /// <summary>
    /// Clears all enqueued actions. Typically used at the start of a new execution-strategy attempt.
    /// </summary>
    void Reset();

    /// <summary>
    /// Executes all enqueued actions sequentially on the current thread.
    /// Exceptions are logged but do not halt execution of subsequent actions.
    /// </summary>
    Task FlushAsync();

    /// <summary>
    /// Gets the number of actions currently queued for execution.
    /// </summary>
    int Count { get; }
  }
}
