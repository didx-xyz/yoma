namespace Yoma.Core.Domain.Core.Helpers
{
  public static class RetryHelper
  {
    public static async Task<T?> RetryUntilAsync<T>(
       Func<Task<T?>> action,
       Func<T?, bool> exitCondition,
       TimeSpan timeout,
       TimeSpan? delay = null,
       Action<int>? onRetry = null)
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
        var result = await action();

        if (exitCondition(result) || DateTimeOffset.UtcNow - start >= timeout)
          return result;

        attempt++;
        onRetry?.Invoke(attempt);

        await Task.Delay(delay.Value);
      }
    }
    public static T? RetryUntil<T>(
        Func<T?> action,
        Func<T?, bool> exitCondition,
        TimeSpan timeout,
        TimeSpan? delay = null,
        Action<int>? onRetry = null)
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
        var result = action();

        if (exitCondition(result) || DateTimeOffset.UtcNow - start >= timeout)
          return result;

        attempt++;
        onRetry?.Invoke(attempt);

        Thread.Sleep(delay.Value);
      }
    }
  }
}
