using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using Yoma.Core.Domain.Core;
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
    private readonly IProgramInfoService _programInfoService;
    private readonly ILinkService _linkService;
    private readonly ILinkUsageService _linkUsageService;
    #endregion

    #region Constructor
    public ReferralController(ILogger<ReferralController> logger,
      IReferralService referralService,
      IProgramService programService,
      IProgramInfoService programInfoService,
      ILinkService linkService,
      ILinkUsageService linkUsageService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _referralService = referralService ?? throw new ArgumentNullException(nameof(referralService));
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _programInfoService = programInfoService ?? throw new ArgumentNullException(nameof(programInfoService));
      _linkService = linkService ?? throw new ArgumentNullException(nameof(linkService));
      _linkUsageService= linkUsageService ?? throw new ArgumentNullException(nameof(linkUsageService));
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Get the referral program by id")]
    [HttpGet("program/{id}/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<Domain.Referral.Models.Program> GetProgramById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetProgramById));

      var result = _programService.GetById(id, true, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetProgramById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral programs based on the supplied filter")]
    [HttpPost("program/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ProgramSearchResults> SearchProgram([FromBody] ProgramSearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchProgram));

      var result = _programService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Create a new referral program")]
    [HttpPost("program/create")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> CreateProgram([FromForm] ProgramRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateProgram));

      var result = await _programService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the specified referral program")]
    [HttpPatch("program/update")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateProgram([FromForm] ProgramRequestUpdate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgram));

      var result = await _programService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update referral program status (Active / Inactive / Deleted)")]
    [HttpPatch("program/{id}/{status}")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<ProgramInfo>> UpdateProgramStatus([FromRoute] Guid id, [FromRoute] ProgramStatus status)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgramStatus));

      var result = await _programService.UpdateStatus(id, status);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgramStatus));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral links based on the supplied filter")]
    [HttpPost("link/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ReferralLinkSearchResults> SearchLink([FromBody] ReferralLinkSearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchLink));

      var result = _linkService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search link usages based on the supplied filter")]
    [HttpPost("link/usage/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ReferralLinkUsageSearchResults> SearchLinkUsage([FromBody] ReferralLinkUsageSearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchLinkUsage));

      var result = _linkUsageService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchLinkUsage));

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
    public ActionResult<ProgramSearchResults> SearchProgram([FromBody] ProgramSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchProgram));

      var result = _programService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get an active referral program by id (Authenticated User)")]
    [HttpGet("program/{id}/info")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ProgramInfo> GetProgramInfoById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetProgramInfoById));

      var result = _programInfoService.GetById(id);

      _logger.LogInformation("Request {requestName} handled", nameof(GetProgramInfoById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get referral link by id (Authenticated User)",
      Description = "Admins can fetch any link. User can only fetch their own")]
    [HttpGet("link/{id}")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkInfo> GetLinkById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetLinkById));

      var result = _linkService.GetById(id, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetLinkById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for my referral links based on the supplied filter (Authenticated User)")]
    [HttpPost("link/search")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkSearchResults> SearchLink([FromBody] ReferralLinkSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchLink));

      var result = _linkService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Create a new referral link (Authenticated User)")]
    [HttpPost("link/create")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult<ReferralLinkInfo>> CreateLink([FromBody] ReferralLinkRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateLink));

      var result = await _linkService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update my referral link (Authenticated User)")]
    [HttpPatch("link/update")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult<ReferralLinkInfo>> UpdateLink([FromBody] ReferralLinkRequestUpdate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateLink));

      var result = await _linkService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Cancel a referral link (Authenticated User)",
      Description = "Admins can cancel any link. Users can only cancel their own")]
    [HttpPatch("link/{id}/cancel")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult<ReferralLinkInfo>> CancelLink([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CancelLink));

      var result = await _linkService.UpdateStatus(id, ReferralLinkStatus.Cancelled);

      _logger.LogInformation("Request {requestName} handled", nameof(CancelLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get my usage for a link (Authenticated User)")]
    [HttpGet("link/{id}/usage")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkUsageInfo> GetUsageByLinkAsReferee([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetUsageByLinkAsReferee));

      var result = _linkUsageService.GetByIdAsReferee(id);

      _logger.LogInformation("Request {requestName} handled", nameof(GetUsageByLinkAsReferee));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search link usages as referrer based on the supplied filter (Authenticated User)")]
    [HttpPost("link/usage/search/referrer")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkUsageSearchResults> SearchLinkUsageAsReferrer([FromBody] ReferralLinkUsageSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchLinkUsageAsReferrer));

      var result = _linkUsageService.SearchAsReferrer(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchLinkUsageAsReferrer));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search my link usages as referee based on the supplied filter (Authenticated User)")]
    [HttpPost("link/usage/search/referee")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkUsageSearchResults> SearchLinkUsageAsReferee([FromBody] ReferralLinkUsageSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchLinkUsageAsReferee));

      var result = _linkUsageService.SearchAsReferee(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchLinkUsageAsReferee));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Claim a referral link (Authenticated User)")]
    [HttpPost("link/{id}/claim")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult> ClaimAsReferee([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ClaimAsReferee));

      await _linkUsageService.ClaimAsReferee(id);

      _logger.LogInformation("Request {requestName} handled", nameof(ClaimAsReferee));

      return Ok();
    }
    #endregion
    #endregion
  }
}
