using Flurl;
using Flurl.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.Zlto.Models;

namespace Yoma.Core.Infrastructure.Zlto
{
  public sealed class HealthCheck : IHealthCheck
  {
    #region Class Variables
    private readonly ZltoOptions _options;
    private readonly (string Name, string? Url)[] _endpoints;
    #endregion

    #region Constructor
    public HealthCheck(IOptions<ZltoOptions> options)
    {
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));

      _endpoints =
      [
        (nameof(ZltoOptions.Partner), _options.Partner?.BaseUrl?.TrimEnd('/')),
        (nameof(ZltoOptions.Wallet), _options.Wallet?.BaseUrl?.TrimEnd('/')),
        (nameof(ZltoOptions.Store), _options.Store?.BaseUrl?.TrimEnd('/')),
        (nameof(ZltoOptions.Task), _options.Task?.BaseUrl?.TrimEnd('/')),
      ];

      foreach (var (Name, Url) in _endpoints)
      {
        if (string.IsNullOrWhiteSpace(Url))
          throw new InvalidOperationException($"{ZltoOptions.Section}.{Name}.BaseUrl is not configured");
      }
    }
    #endregion

    #region Public Members
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
      var probeTasks = _endpoints.Select(async e =>
      {
        try
        {
          var url = new Url(e.Url);
          await url.WithAuthHeader(GetAuthHeaderApiKey()).GetAsync(cancellationToken: cancellationToken).EnsureSuccessStatusCodeAsync();
          return (e.Name, Failure: (string?)null);
        }
        catch (HttpClientException ex)
        {
          return (e.Name, Failure: $"{e.Name} [{(int)ex.StatusCode} {ex.StatusCode}] {e.Url}");
        }
        catch (TaskCanceledException)
        {
          return (e.Name, Failure: $"{e.Name} [timeout] {e.Url}");
        }
        catch (Exception ex)
        {
          return (e.Name, Failure: $"{e.Name} [{ex.GetType().Name}] {e.Url}");
        }
      }).ToArray();

      var results = await System.Threading.Tasks.Task.WhenAll(probeTasks);
      var failures = results.Where(r => !string.IsNullOrEmpty(r.Failure)).Select(r => r.Failure!).ToArray();

      if (failures.Length == 0) return HealthCheckResult.Healthy($"{ZltoOptions.Section} endpoints: OK");

      return HealthCheckResult.Unhealthy($"{ZltoOptions.Section} endpoints failing: {string.Join(", ", failures)}");
    }
    #endregion

    #region Private Members
    private KeyValuePair<string, string> GetAuthHeaderApiKey()
    {
      return new KeyValuePair<string, string>(_options.ApiKeyHeaderName, _options.ApiKey);
    }
    #endregion
  }
}
