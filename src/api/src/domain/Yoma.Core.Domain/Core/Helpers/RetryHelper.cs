using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Core.Helpers
{
  public static class RetryHelper
  {
    public static async Task<T?> RetryUntilAsync<T>(
      Func<Task<T?>> action,
      Func<T?, bool> exitCondition,
      TimeSpan timeout,
      bool retryOnException,
      TimeSpan? delay = null,
      Action<int>? onRetry = null,
      ILogger? logger = null)
      where T : class
    {
      ArgumentNullException.ThrowIfNull(action);
      ArgumentNullException.ThrowIfNull(exitCondition);

      if (timeout <= TimeSpan.Zero)
        throw new ArgumentOutOfRangeException(nameof(timeout), "Timeout must be greater than TimeSpan.Zero");

      if (delay is { } d && d <= TimeSpan.Zero)
        throw new ArgumentOutOfRangeException(nameof(delay), "Delay must be greater than TimeSpan.Zero if specified");

      var start = DateTimeOffset.UtcNow;
      var attempt = 0;
      delay ??= TimeSpan.FromSeconds(1);

      while (true)
      {
        T? result = null;

        try
        {
          result = await action();
        }
        catch (Exception ex)
        {
          if (!retryOnException) throw;

          attempt++;
          onRetry?.Invoke(attempt);

          logger?.LogWarning(ex, "Retry attempt {attempt} failed with exception: {message}", attempt, ex.Message);

          await Task.Delay(delay.Value);
          continue;
        }

        if (exitCondition(result))
          return result;

        if (DateTimeOffset.UtcNow - start >= timeout)
        {
          logger?.LogWarning("RetryUntilAsync: Timeout ({timeout}ms) reached after {attempts} attempts", timeout.TotalMilliseconds, attempt);
          return result;
        }

        attempt++;
        onRetry?.Invoke(attempt);

        await Task.Delay(delay.Value);
      }
    }

    public static T? RetryUntil<T>(
       Func<T?> action,
       Func<T?, bool> exitCondition,
       TimeSpan timeout,
       bool retryOnException,
       TimeSpan? delay = null,
       Action<int>? onRetry = null,
       ILogger? logger = null)
       where T : class
    {
      ArgumentNullException.ThrowIfNull(action);
      ArgumentNullException.ThrowIfNull(exitCondition);

      if (timeout <= TimeSpan.Zero)
        throw new ArgumentOutOfRangeException(nameof(timeout), "Timeout must be greater than TimeSpan.Zero");

      if (delay is { } d && d <= TimeSpan.Zero)
        throw new ArgumentOutOfRangeException(nameof(delay), "Delay must be greater than TimeSpan.Zero if specified");

      var start = DateTimeOffset.UtcNow;
      var attempt = 0;
      delay ??= TimeSpan.FromSeconds(1);

      while (true)
      {
        T? result = null;

        try
        {
          result = action();
        }
        catch (Exception ex)
        {
          if (!retryOnException)
            throw;

          attempt++;
          onRetry?.Invoke(attempt);
          logger?.LogWarning(ex, "Retry attempt {attempt} failed with exception: {message}", attempt, ex.Message);

          Thread.Sleep(delay.Value);
          continue;
        }

        if (exitCondition(result))
          return result;

        if (DateTimeOffset.UtcNow - start >= timeout)
        {
          logger?.LogWarning("RetryUntil: Timeout ({timeout}ms) reached after {attempts} attempts", timeout.TotalMilliseconds, attempt);
          return result;
        }

        attempt++;
        onRetry?.Invoke(attempt);

        Thread.Sleep(delay.Value);
      }
    }
  }
}
