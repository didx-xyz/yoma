using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Yoma.Core.Domain.Analytics.Interfaces;
using Swashbuckle.AspNetCore.Annotations;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/analytics")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  public class AnalyticsController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<AnalyticsController> _logger;
    private readonly IAnalyticsService _analyticsService;
    #endregion

    #region Constructor
    public AnalyticsController(ILogger<AnalyticsController> logger,
        IAnalyticsService analyticsService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _analyticsService = analyticsService ?? throw new ArgumentNullException(nameof(analyticsService));
    }
    #endregion

    #region Public Members
    #region Anonymous Actions
    [SwaggerOperation(Summary = "Get platform metrics (Anonymous)",
      Description = "Returns platform metrics using rounded values suitable for public display")]
    [HttpGet("platform/metrics")]
    [AllowAnonymous]
    public ActionResult<PlatformMetrics> GetPlatformMetrics()
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetPlatformMetrics));

      var result = _analyticsService.GetPlatformMetrics();

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetPlatformMetrics));

      return Ok(result);
    }
    #endregion Anonymous Actions

    #region Administrative Actions
    [SwaggerOperation(Summary = "Get platform metrics (Admin or Organization Admin roles required)",
      Description = "Returns platform metrics using actual values without rounding")]
    [HttpGet("platform/metrics/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public ActionResult<PlatformMetricsAdmin> GetPlatformMetricsAdmin()
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetPlatformMetricsAdmin));

      var result = _analyticsService.GetPlatformMetricsAdmin();

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetPlatformMetricsAdmin));

      return Ok(result);
    }
    #endregion Administrative Actions
    #endregion
  }
}
