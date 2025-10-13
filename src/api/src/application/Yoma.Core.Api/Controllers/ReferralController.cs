using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Referral;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/ssi")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin role required)")]
  public class ReferralController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<ReferralController> _logger;
    private readonly IReferralProgramService _referralProgramService;
    #endregion

    #region Constructor
    public ReferralController(
      ILogger<ReferralController> logger,
      IReferralProgramService referralProgramService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _referralProgramService = referralProgramService ?? throw new ArgumentNullException(nameof(referralProgramService));
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Get the referral program by id")]
    [HttpGet("program/{id}")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ReferralProgram> GetById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetById));

      var result = _referralProgramService.GetById(id, true, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral programs based on the supplied filter")]
    [HttpPost("program/search")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ReferralProgramSearchResults> Search([FromBody] ReferralProgramSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _referralProgramService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Create a new referral program")]
    [HttpPost("program/create")]
    [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<ReferralProgram>> Create([FromBody] ReferralProgramRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Create));

      var result = await _referralProgramService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(Create));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the specified referral program")]
    [HttpPatch("program/update")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<ReferralProgram>> Update([FromBody] ReferralProgramRequestUpdate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Update));

      var result = await _referralProgramService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(Update));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update referral program status (Active / Inactive / Deleted [Archived])")]
    [HttpPatch("program/{id}/{status}")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<ReferralProgram>> UpdateStatus([FromRoute] Guid id, [FromRoute] ProgramStatus status)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

      var result = await _referralProgramService.UpdateStatus(id, status);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

      return Ok(result);
    }
    #endregion
    #endregion
  }
}
