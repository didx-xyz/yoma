using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Treasury.Interfaces;
using Yoma.Core.Domain.Treasury.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/treasury")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin role required)")]
  public class TreasuryController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<TreasuryController> _logger;
    private readonly ITreasuryService _treasuryService;
    #endregion

    #region Constructor
    public TreasuryController(ILogger<TreasuryController> logger,
        ITreasuryService treasuryService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _treasuryService = treasuryService ?? throw new ArgumentNullException(nameof(treasuryService));
    }
    #endregion

    #region Public Members
    [SwaggerOperation(Summary = "Get treasury info",
      Description = "Returns the treasury configuration and top-level treasury information. " +
      "Detailed treasury data for organizations, opportunities and referral programs," +
      "including pools, cumulative amounts, and balances, must be queried via the existing admin search endpoints: " +
      "'organization/search', 'referral/program/search/admin', and 'opportunity/search/admin'")]
    [HttpGet]
    [Authorize(Roles = Constants.Role_OrganizationAdmin)]
    public ActionResult<TreasuryInfo> Get()
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(Get));

      var result = _treasuryService.Get();

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(Get));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update treasury info",
      Description = "Updates the treasury configuration")]
    [HttpPatch]
    public async Task<ActionResult<TreasuryInfo>> Update(TreasuryRequestUpdate request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(Update));

      var result = await _treasuryService.Update(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(Update));

      return Ok(result);
    }
    #endregion Public Members 
  }
}
