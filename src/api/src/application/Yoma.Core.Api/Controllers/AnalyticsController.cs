using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Analytics.Interfaces;
using Yoma.Core.Domain.Analytics.Models;
using Yoma.Core.Domain.Core;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/analytics")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin or Organization Admin roles required)")]
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
      Description = "Returns platform-wide metrics rounded down for public display")]
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
    [SwaggerOperation(Summary = "Get platform metrics",
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

    [SwaggerOperation(Summary = "Return a list of countries associated with users that engaged with opportunities (viewed and / or completed)",
      Description = "Organization fitlering: optional for Admin role. Required for Organization Admin role")]
    [HttpGet("search/country")]
    [ProducesResponseType(typeof(List<Domain.Lookups.Models.Country>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult ListSearchCriteriaCountriesEngaged([FromQuery, SwaggerParameter("Optional for Admin role. Required for Organization Admin role", Required = false)] List<Guid>? organizations)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(ListSearchCriteriaCountriesEngaged));

      var result = _analyticsService.ListSearchCriteriaCountriesEngaged(organizations);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(ListSearchCriteriaCountriesEngaged));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for engagement analytics based on the supplied filter",
      Description = "Organization filtering: optional for Admin role. Required for Organization Admin role")]
    [HttpPost("search/engagement")]
    [ProducesResponseType(typeof(SearchResultsEngagement), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult SearchEngagement([FromBody] SearchFilterEngagement filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchEngagement));

      var result = _analyticsService.SearchEngagement(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchEngagement));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for opportunity analytics based on the supplied filter",
      Description = "Organization filtering: optional for Admin role. Required for Organization Admin role")]
    [HttpPost("search/opportunities")]
    [ProducesResponseType(typeof(SearchResultsOpportunity), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult SearchOpportunities([FromBody] SearchFilterOpportunity filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchOpportunities));

      var result = _analyticsService.SearchOpportunities(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchOpportunities));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for youth analytics based on the supplied filter",
      Description = "Organization filtering: optional for Admin role. Required for Organization Admin role")]
    [HttpPost("search/youth")]
    [ProducesResponseType(typeof(SearchResultsYouth), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult SearchYouth([FromBody] SearchFilterYouth filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchYouth));

      var result = _analyticsService.SearchYouth(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchYouth));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for SSO analytics based on the supplied filter",
      Description = "Organization filtering: optional for Admin role. Required for Organization Admin role. Non-partner based SSO metrics i.e. Google/Facebook are only included for admins")]
    [HttpPost("search/sso")]
    [ProducesResponseType(typeof(SearchResultsSSO), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult SearchSSO([FromBody] SearchFilterSSO filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchSSO));

      var result = _analyticsService.SearchSSO(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchSSO));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    #endregion Administrative Actions
    #endregion
  }
}
