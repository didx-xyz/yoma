using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Referral.Interfaces;
using Yoma.Core.Domain.Referral.Interfaces.Lookups;
using Yoma.Core.Domain.Referral.Models;
using Yoma.Core.Domain.Referral.Models.Lookups;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/referral")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, User role required)")]
  public class ReferralController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<ReferralController> _logger;
    private readonly IBlockService _blockService;
    private readonly IProgramService _programService;
    private readonly IProgramInfoService _programInfoService;
    private readonly ILinkService _linkService;
    private readonly ILinkUsageService _linkUsageService;
    private readonly IBlockReasonService _blockReasonService;
    #endregion

    #region Constructor
    public ReferralController(ILogger<ReferralController> logger,
      IBlockService blockService,
      IProgramService programService,
      IProgramInfoService programInfoService,
      ILinkService linkService,
      ILinkUsageService linkUsageService,
      IBlockReasonService blockReasonService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _blockService = blockService ?? throw new ArgumentNullException(nameof(blockService));
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _programInfoService = programInfoService ?? throw new ArgumentNullException(nameof(programInfoService));
      _linkService = linkService ?? throw new ArgumentNullException(nameof(linkService));
      _linkUsageService = linkUsageService ?? throw new ArgumentNullException(nameof(linkUsageService));
      _blockReasonService = blockReasonService ?? throw new ArgumentNullException(nameof(blockReasonService));
    }
    #endregion

    #region Public Members
    #region Authenticated User Based Actions
    [SwaggerOperation(
      Summary = "Check if any referral programs are available (Authenticated User)",
      Description = "Returns true if there are any referral programs available that are active and have started")]
    [HttpGet("program/available")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<bool> GetAvailable()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetAvailable));

      var result = _programInfoService.Available();

      _logger.LogInformation("Request {requestName} handled", nameof(GetAvailable));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get the default referral program (Authenticated User)",
      Description = "Retrieves the default referral program. The default program must be active and have started")]
    [HttpGet("program/default/info")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ProgramInfo> GetProgramInfoDefault()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetProgramInfoDefault));

      var result = _programInfoService.GetDefault();

      _logger.LogInformation("Request {requestName} handled", nameof(GetProgramInfoDefault));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral programs (Authenticated User)",
      Description = "By default, only programs that are active and have started are included. Expired programs can be optionally included via the filter")]
    [HttpPost("program/search")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ProgramSearchResultsInfo> SearchProgram([FromBody] ProgramSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchProgram));

      var result = _programInfoService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get a referral program by Id (Authenticated User)",
      Description = "Retrieves a program by Id. Programs are available if active and have started; expired programs are also retrievable")]
    [HttpGet("program/{id}/info")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ProgramInfo> GetProgramInfoById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetProgramInfoById));

      var result = _programInfoService.GetActiveOrExpiredAndStartedById(id, true, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetProgramInfoById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get referral link by id (Authenticated User)",
      Description = "Admins can fetch any link. User can only fetch their own")]
    [HttpGet("link/{id}")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLink> GetLinkById([FromRoute] Guid id, [FromQuery] bool? includeQRCode)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetLinkById));

      var result = _linkService.GetById(id, true, true, true, includeQRCode);

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
    public async Task<ActionResult<ReferralLink>> CreateLink([FromBody] ReferralLinkRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateLink));

      var result = await _linkService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update my referral link (Authenticated User)",
      Description = "The link must belong to the user making the request")]
    [HttpPatch("link/update")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult<ReferralLink>> UpdateLink([FromBody] ReferralLinkRequestUpdate request)
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
    public async Task<ActionResult<ReferralLink>> CancelLink([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CancelLink));

      var result = await _linkService.Cancel(id);

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

    #region Administrative Actions
    [SwaggerOperation(Summary = "Return a list of block reasons (Admin role required)")]
    [HttpGet("block/reason")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<BlockReason> ListBlockReasons()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListBlockReasons));

      var result = _blockReasonService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListBlockReasons));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Block a referrer (Admin role required)")]
    [HttpPut("block")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Block>> BlockReferrer([FromBody] BlockRequest request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(BlockReferrer));

      var result = await _blockService.Block(request);

      _logger.LogInformation("Request {requestName} handled", nameof(BlockReferrer));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Unblock a referrer (Admin role required)")]
    [HttpPatch("unblock")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult> UnblockReferrer([FromBody] UnblockRequest request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UnblockReferrer));

      await _blockService.Unblock(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UnblockReferrer));

      return Ok();
    }

    [SwaggerOperation(Summary = "Get the referral program by id (Admin role required)")]
    [HttpGet("program/{id}/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<Domain.Referral.Models.Program> GetProgramById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetProgramById));

      var result = _programService.GetById(id, true, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetProgramById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral programs based on the supplied filter (Admin role required)")]
    [HttpPost("program/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ProgramSearchResults> SearchProgram([FromBody] ProgramSearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchProgram));

      var result = _programService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Create a new referral program (Admin role required)")]
    [HttpPost("program/create")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> CreateProgram([FromBody] ProgramRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateProgram));

      var result = await _programService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the specified referral program (Admin role required)")]
    [HttpPatch("program/update")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateProgram([FromBody] ProgramRequestUpdate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgram));

      var result = await _programService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the referral program image (Admin role required)")]
    [HttpPatch("program/{id}/image")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateProgramImage([FromRoute] Guid id, [Required] IFormFile file)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgramImage));

      var result = await _programService.UpdateImage(id, file);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgramImage));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the referral program status (Admin role required)",
      Description = "Support statuses active / inactive / deleted")]
    [HttpPatch("program/{id}/{status}")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateProgramStatus([FromRoute] Guid id, [FromRoute] Domain.Referral.ProgramStatus status)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgramStatus));

      var result = await _programService.UpdateStatus(id, status);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgramStatus));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Set the specified referral program as the default (Admin role required)")]
    [HttpPatch("program/{id}/default")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> SetProgramAsDefault([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SetProgramAsDefault));

      var result = await _programService.SetAsDefault(id);

      _logger.LogInformation("Request {requestName} handled", nameof(SetProgramAsDefault));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral links based on the supplied filter (Admin role required)")]
    [HttpPost("link/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ReferralLinkSearchResults> SearchLink([FromBody] ReferralLinkSearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchLink));

      var result = _linkService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search link usages based on the supplied filter (Admin role required)")]
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
    #endregion
  }
}
