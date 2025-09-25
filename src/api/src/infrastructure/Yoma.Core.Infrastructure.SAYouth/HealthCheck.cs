using Flurl.Http;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Exceptions;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Infrastructure.SAYouth.Models;

namespace Yoma.Core.Infrastructure.SAYouth
{
  public sealed class HealthCheck : IHealthCheck
  {
    #region Class Variables
    private readonly SAYouthOptions _options;
    #endregion

    #region Constructor
    public HealthCheck(IOptions<SAYouthOptions> options)
    {
      _options = options.Value ?? throw new ArgumentNullException(nameof(options));

      if (string.IsNullOrEmpty(_options.BaseUrl))
        throw new InvalidOperationException($"{SAYouthOptions.Section}.{nameof(SAYouthOptions.BaseUrl)} is not configured");
    }
    #endregion

    #region Public Members
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
      try
      {
        await _options.BaseUrl.GetAsync(cancellationToken: cancellationToken).EnsureSuccessStatusCodeAsync();

        return HealthCheckResult.Healthy($"{SAYouthOptions.Section} endpoint: OK");
      }
      catch (HttpClientException ex)
      {
        return HealthCheckResult.Unhealthy($"{SAYouthOptions.Section} endpoint failing: [{(int)ex.StatusCode} {ex.StatusCode}] {_options.BaseUrl}");
      }
      catch (TaskCanceledException)
      {
        return HealthCheckResult.Unhealthy($"{SAYouthOptions.Section} endpoint failing: [timeout] {_options.BaseUrl}");
      }
      catch (Exception ex)
      {
        return HealthCheckResult.Unhealthy($"{SAYouthOptions.Section} endpoint failing: [{ex.GetType().Name}] {_options.BaseUrl}");
      }
    }
    #endregion
  }
}
