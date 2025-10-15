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
  [Route($"api/{Common.Constants.Api_Version}/referral")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin role required)")]
  public class ReferralController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<ReferralController> _logger;
    private readonly IReferralService _referralService;
    private readonly IProgramService _programService;
    #endregion

    #region Constructor
    public ReferralController(ILogger<ReferralController> logger,
      IReferralService referralService,
      IProgramService programService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _referralService = referralService ?? throw new ArgumentNullException(nameof(referralService));
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Get the referral program by id")]
    [HttpGet("program/{id}/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<Domain.Referral.Models.Program> GetById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetById));

      var result = _programService.GetById(id, true, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral programs based on the supplied filter")]
    [HttpPost("program/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ProgramSearchResults> Search([FromBody] ProgramSearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _programService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Create a new referral program")]
    [HttpPost("program/create")]
    [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> Create([FromForm] ProgramRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Create));

      var result = await _programService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(Create));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the specified referral program")]
    [HttpPatch("program/update")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> Update([FromForm] ProgramRequestUpdate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Update));

      var result = await _programService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(Update));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update referral program status (Active / Inactive / Deleted)")]
    [HttpPatch("program/{id}/{status}")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateStatus([FromRoute] Guid id, [FromRoute] ProgramStatus status)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

      var result = await _programService.UpdateStatus(id, status);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

      return Ok(result);
    }
    #endregion

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Get the referrals availability status (Authenticated User)",
      Description = "Returns the referrals availability status for the authenticated user, including whether referrals are available, if the user is blocked, and details of the default referral program")]
    [HttpGet("status")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralStatusResponse> GetStatus()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetStatus));

      var result = _referralService.GetStatus();

      _logger.LogInformation("Request {requestName} handled", nameof(GetStatus));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for active referral programs based on the supplied filter (Authenticated User)")]
    [HttpPost("program/search")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ProgramSearchResults> Search([FromBody] ProgramSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _programService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get an active referral program by Id and optionally include the user's completion status (Authenticated User)",
      Description = "Returns the referral program detail. If includeStatus=true, includes the authenticated user's completion status as referee")]
    [HttpGet("program/{id}/info")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ProgramInfo> GetById([FromRoute] Guid id, [FromQuery] bool includeStatus = false)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetById));

      var result = _referralService.GetProgramAndStatusById(id, includeStatus);
      if (result is null) return NotFound();

      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return Ok(result);
    }
    #endregion
    #endregion
  }
}
