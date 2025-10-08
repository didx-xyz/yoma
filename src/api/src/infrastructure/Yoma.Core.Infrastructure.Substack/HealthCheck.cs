using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.Substack.Models;

namespace Yoma.Core.Infrastructure.Substack
{
  public sealed class HealthCheck : IHealthCheck
  {
    #region Class Variables
    private readonly SubstackOptions _options;
    private readonly (string Name, string Url)[] _feeds;
    #endregion

    #region Constructor
    public HealthCheck(IOptions<SubstackOptions> options)
    {
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));

      if (string.IsNullOrWhiteSpace(_options.UserAgent))
        throw new InvalidOperationException($"{SubstackOptions.Section}.UserAgent is not configured");
      if (_options.RequestTimeoutSeconds <= 0)
        throw new InvalidOperationException($"{SubstackOptions.Section}.RequestTimeoutSeconds must be > 0");
      if (_options.Feeds is null || _options.Feeds.Count == 0)
        throw new InvalidOperationException($"{SubstackOptions.Section}.Feeds is not configured");

      _feeds = [.. _options.Feeds
        .Select(kvp =>
        {
          var feedType = kvp.Key;
          var feedCfg = kvp.Value;
          var name = $"{feedType} ({feedCfg.Title})";
          var url = feedCfg.FeedURL;
          if (string.IsNullOrWhiteSpace(url))
            throw new InvalidOperationException($"{SubstackOptions.Section}.Feeds[{feedType}].URL is not configured");
          return (name, url);
        })];
    }
    #endregion

    #region Public Members
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
      var probeTasks = _feeds.Select(async f =>
      {
        try
        {
          await new Url(f.Url)
          .WithHeader("User-Agent", _options.UserAgent)
          .WithTimeout(TimeSpan.FromSeconds(_options.RequestTimeoutSeconds))
          .SendAsync(HttpMethod.Head, cancellationToken: cancellationToken)
          .EnsureSuccessStatusCodeAsync();

          return (f.Name, Failure: default(string));
        }
        catch (HttpClientException ex)
        {
          return (f.Name, Failure: $"{f.Name} [{(int)ex.StatusCode} {ex.StatusCode}] {f.Url}");
        }
        catch (TaskCanceledException)
        {
          return (f.Name, Failure: $"{f.Name} [timeout] {f.Url}");
        }
        catch (Exception ex)
        {
          return (f.Name, Failure: $"{f.Name} [{ex.GetType().Name}] {f.Url}");
        }
      }).ToArray();

      var results = await Task.WhenAll(probeTasks);
      var failures = results.Where(r => !string.IsNullOrEmpty(r.Failure)).Select(r => r.Failure!).ToArray();

      if (failures.Length == 0) return HealthCheckResult.Healthy($"{SubstackOptions.Section} feeds: OK");

      return HealthCheckResult.Unhealthy($"{SubstackOptions.Section} feeds failing: {string.Join(", ", failures)}");
    }
    #endregion
  }
}
