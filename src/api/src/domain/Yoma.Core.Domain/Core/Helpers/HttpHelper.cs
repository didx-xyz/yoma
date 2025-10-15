using System.Net;
using Microsoft.Extensions.Logging;

namespace Yoma.Core.Domain.Core.Helpers
{
  /// <summary>
  /// Minimal, dependency-free HTTP retry helper for transient errors.
  /// Defaults: 2 attempts, retries on 408/429/5xx and common transient exceptions.
  /// </summary>
  public static class HttpHelper
  {
    #region Public Members
    /// <summary>
    /// Sends an HTTP request with a tiny retry policy.
    /// Use a request factory because HttpRequestMessage instances are single-use.
    /// </summary>
    /// <param name="client">HttpClient to use.</param>
    /// <param name="requestFactory">Factory that returns a fresh HttpRequestMessage per attempt.</param>
    /// <param name="logger">Optional logger for warnings.</param>
    /// <param name="maxAttempts">Total attempts (including first). Default 2.</param>
    /// <param name="initialDelay">Initial backoff delay. Default 3 seconds.</param>
    /// <returns>HttpResponseMessage (caller is responsible for disposing it).</returns>
    public static async Task<HttpResponseMessage> SendWithRetryAsync(
      HttpClient client,
      Func<HttpRequestMessage> requestFactory,
      ILogger? logger = null,
      int maxAttempts = 2,
      TimeSpan? initialDelay = null)
    {
      ArgumentNullException.ThrowIfNull(client, nameof(client));
      ArgumentNullException.ThrowIfNull(requestFactory, nameof(requestFactory));
      ArgumentOutOfRangeException.ThrowIfLessThan(maxAttempts, 1, nameof(maxAttempts));

      var delay = initialDelay ?? TimeSpan.FromSeconds(3);
      var attempt = 0;

      while (true)
      {
        attempt++;

        using var request = requestFactory();
        HttpResponseMessage? response = null;
        try
        {
          response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead).ConfigureAwait(false);

          if (!IsTransientStatus(response.StatusCode) || attempt >= maxAttempts)
            return response;

          // transient status and we still have retries left
          logger?.LogWarning("Transient HTTP {Status} for {Url}. Retrying... (attempt {Attempt}/{MaxAttempts})",
            (int)response.StatusCode, request.RequestUri, attempt, maxAttempts);

          response.Dispose();
        }
        catch (Exception ex) when (IsTransientException(ex))
        {
          if (attempt >= maxAttempts) throw;

          logger?.LogWarning(ex, "Transient HTTP exception for {Url}. Retrying... (attempt {Attempt}/{MaxAttempts})",
            request.RequestUri, attempt, maxAttempts);
        }

        // backoff
        await Task.Delay(delay).ConfigureAwait(false);
        delay = TimeSpan.FromMilliseconds(delay.TotalMilliseconds * 2); // simple exponential backoff
      }
    }

    /// <summary>Returns true for 408, 429, and 5xx.</summary>
    public static bool IsTransientStatus(HttpStatusCode status) =>
      status == HttpStatusCode.RequestTimeout ||               // 408
      (int)status == 429 ||                                    // Too Many Requests
      (int)status >= 500;                                      // 5xx

    /// <summary>Returns true for common transient exceptions.</summary>
    public static bool IsTransientException(Exception ex) =>
      ex is HttpRequestException ||
      ex is TaskCanceledException; // includes timeouts without CT
  }
  #endregion
}
