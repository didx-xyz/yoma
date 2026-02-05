using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Referral;
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
    private readonly IAnalyticsService _analyticsService;
    #endregion

    #region Constructor
    public ReferralController(ILogger<ReferralController> logger,
      IBlockService blockService,
      IProgramService programService,
      IProgramInfoService programInfoService,
      ILinkService linkService,
      ILinkUsageService linkUsageService,
      IBlockReasonService blockReasonService,
      IAnalyticsService analyticsService)
    {
      _logger = logger ?? throw new ArgumentNullException(nameof(logger));
      _blockService = blockService ?? throw new ArgumentNullException(nameof(blockService));
      _programService = programService ?? throw new ArgumentNullException(nameof(programService));
      _programInfoService = programInfoService ?? throw new ArgumentNullException(nameof(programInfoService));
      _linkService = linkService ?? throw new ArgumentNullException(nameof(linkService));
      _linkUsageService = linkUsageService ?? throw new ArgumentNullException(nameof(linkUsageService));
      _blockReasonService = blockReasonService ?? throw new ArgumentNullException(nameof(blockReasonService));
      _analyticsService = analyticsService ?? throw new ArgumentNullException(nameof(analyticsService));
    }
    #endregion

    #region Public Members
    #region Anonymous Actions
    [SwaggerOperation(Summary = "Check if any referral programs are available (Anonymous)",
      Description =
        "Returns true if there are any referral programs available that are active and have started (thus published state Active). " +
        "Country filtering behavior: " +
        "Anonymous users default to world-wide programs when no countries are specified, otherwise results are filtered by the specified countries. " +
        "Authenticated users (non-admin) are automatically filtered by their user country when available (including word-wide), otherwise default to world-wide or the specified countries. " +
        "Administrators may optionally filter by countries")]
    [HttpGet("program/available")]
    [AllowAnonymous]
    public ActionResult<bool> GetAvailable([FromQuery] List<Guid>? countries)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetAvailable));

      var result = _programInfoService.Available(countries);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetAvailable));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get the default referral program (Anonymous)",
      Description = "Retrieves the default referral program.  The default program must be active, have started, and is available world-wide")]
    [HttpGet("program/default/info")]
    [AllowAnonymous]
    public ActionResult<ProgramInfo> GetProgramInfoDefault()
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetProgramInfoDefault));

      var result = _programInfoService.GetDefault();

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetProgramInfoDefault));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Return a list of countries associated with programs (Anonymous)",
      Description =
        "By default, results include programs that are active and have started (published state Active). Authenticated users may override the default behavior. " +
        "Country resolution behavior: " +
        "Anonymous and administrative users receive all countries linked to programs, including World-Wide where applicable. " +
        "Authenticated users (non-admin) receive their user country when available, and World-Wide if programs are associated with it"
    )]
    [HttpGet("program/search/filter/country")]
    [AllowAnonymous]
    public ActionResult<List<Domain.Lookups.Models.Country>> ListProgramSearchCriteriaCountries([FromQuery] List<PublishedState>? publishedStates)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(ListProgramSearchCriteriaCountries));

      var result = _programService.ListSearchCriteriaCountries(publishedStates);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(ListProgramSearchCriteriaCountries));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral programs (Anonymous)",
      Description =
        "By default, results include programs that are active and have started (thus published state Active). Authenticated users can override the default behavior. " +
        "Country filtering behavior: " +
        "Anonymous users default to world-wide programs when no countries are specified, otherwise results are filtered by the specified countries. " +
        "Authenticated users (non-admin) are automatically filtered by their user country when available (including world-wide), otherwise default to world-wide or the specified countries. " +
        "Administrators may optionally filter by countries")]
    [HttpPost("program/search")]
    [AllowAnonymous]
    public ActionResult<ProgramSearchResultsInfo> SearchProgram([FromBody] ProgramSearchFilter filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchProgram));

      var result = _programInfoService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get the referral program by Id (Anonymous)",
      Description =
        "By default, only programs that are active or uncompleted, and have started can be retrieved. " +
        "Authenticated non-admin users are restricted to programs available in their country (or world-wide) when a country is set; otherwise they may retrieve any program. " +
        "Administrators may retrieve any program")]
    [HttpGet("program/{id}/info")]
    [AllowAnonymous]
    public ActionResult<ProgramInfo> GetProgramInfoById([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetProgramInfoById));

      var result = _programInfoService.GetById(id, true, true);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetProgramInfoById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get the referral program by link Id (Anonymous)",
      Description =
        "By default, only programs that are active or uncompleted, and have started can be retrieved. " +
        "Authenticated non-admin users are restricted to programs available in their country (or world-wide) when a country is set; otherwise they may retrieve any program. " +
        "Administrators may retrieve any program")]
    [HttpGet("program/by-link/{linkId}/info")]
    [AllowAnonymous]
    public ActionResult<ProgramInfo> GetProgramInfoByLinkId([FromRoute] Guid linkId)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetProgramInfoByLinkId));

      var result = _programInfoService.GetByLinkId(linkId, true, true);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetProgramInfoByLinkId));

      return Ok(result);
    }
    #endregion

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Get referral link by id (Authenticated User)",
      Description = "Admins can fetch any link. User can only fetch their own")]
    [HttpGet("link/{id}")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLink> GetLinkById([FromRoute] Guid id, [FromQuery] bool? includeQRCode)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetLinkById));

      var result = _linkService.GetById(id, true, true, true, includeQRCode);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetLinkById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for my referral links based on the supplied filter (Authenticated User)")]
    [HttpPost("link/search")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkSearchResults> SearchLink([FromBody] ReferralLinkSearchFilter filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchLink));

      var result = _linkService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Create a new referral link (Authenticated User)")]
    [HttpPost("link/create")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult<ReferralLink>> CreateLink([FromBody] ReferralLinkRequestCreate request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(CreateLink));

      var result = await _linkService.Create(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(CreateLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update my referral link (Authenticated User)",
      Description = "The link must belong to the user making the request")]
    [HttpPatch("link/update")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult<ReferralLink>> UpdateLink([FromBody] ReferralLinkRequestUpdate request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(UpdateLink));

      var result = await _linkService.Update(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(UpdateLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Cancel a referral link (Authenticated User)",
      Description = "Admins can cancel any link. Users can only cancel their own")]
    [HttpPatch("link/{id}/cancel")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult<ReferralLink>> CancelLink([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(CancelLink));

      var result = await _linkService.Cancel(id);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(CancelLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get usage for a link by usage Id (Authenticated User)",
      Description = "Admins can fetch any usage. Referrers can fetch usage for links they own. Referees can fetch usage for links they have claimed")]
    [HttpGet("link/usage/{id}")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkUsageInfo> GetUsageById([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetUsageById));

      var result = _linkUsageService.GetById(id, true, true, true);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetUsageById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Get my usage for a link by program Id as referee (Authenticated User)")]
    [HttpGet("program/{id}/link/usage/referee")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkUsageInfo> GetUsageByProgramIdAsReferee([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetUsageByProgramIdAsReferee));

      var result = _linkUsageService.GetByProgramIdAsReferee(id, true);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetUsageByProgramIdAsReferee));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search link usages as referrer based on the supplied filter (Authenticated User)")]
    [HttpPost("link/usage/search/referrer")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkUsageSearchResults> SearchLinkUsageAsReferrer([FromBody] ReferralLinkUsageSearchFilter filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchLinkUsageAsReferrer));

      var result = _linkUsageService.SearchAsReferrer(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchLinkUsageAsReferrer));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search my link usages as referee based on the supplied filter (Authenticated User)")]
    [HttpPost("link/usage/search/referee")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralLinkUsageSearchResults> SearchLinkUsageAsReferee([FromBody] ReferralLinkUsageSearchFilter filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchLinkUsageAsReferee));

      var result = _linkUsageService.SearchAsReferee(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchLinkUsageAsReferee));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Claim a referral link (Authenticated User)")]
    [HttpPost("link/{id}/claim")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<ActionResult> ClaimAsReferee([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(ClaimAsReferee));

      await _linkUsageService.ClaimAsReferee(id);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(ClaimAsReferee));

      return Ok();
    }

    [SwaggerOperation(Summary = "Get my referral analytics (Authenticated User)",
      Description = "Returns your referral statistics based on the selected role. Link statistics are referrer-only; usage and reward statistics apply to both roles")]
    [HttpGet("analytics/{role}")]
    [Authorize(Roles = Constants.Role_User)]
    public ActionResult<ReferralAnalyticsUser> GetMyAnalytics([FromRoute] ReferralParticipationRole role)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetMyAnalytics));

      var result = _analyticsService.ByUser(role);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetMyAnalytics));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search referral analytics (Authenticated User)",
      Description = "Returns system-wide referral statistics based on role. Link statistics are referrer-only; usage and reward statistics apply to both roles")]
    [HttpPost("analytics/search")]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult<ReferralAnalyticsSearchResultsInfo<ReferralAnalyticsUserInfo>> SearchAnalytics([FromBody] ReferralAnalyticsSearchFilter filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchAnalytics));

      var result = _analyticsService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchAnalytics));

      return Ok(result);
    }
    #endregion

    #region Administrative Actions
    [SwaggerOperation(Summary = "Return a list of block reasons (Admin role required)")]
    [HttpGet("block/reason")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<BlockReason> ListBlockReasons()
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(ListBlockReasons));

      var result = _blockReasonService.List();

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(ListBlockReasons));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Block a referrer (Admin role required)")]
    [HttpPut("block")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Block>> BlockReferrer([FromBody] BlockRequest request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(BlockReferrer));

      var result = await _blockService.Block(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(BlockReferrer));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Unblock a referrer (Admin role required)")]
    [HttpPatch("unblock")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult> UnblockReferrer([FromBody] UnblockRequest request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(UnblockReferrer));

      await _blockService.Unblock(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(UnblockReferrer));

      return Ok();
    }

    [SwaggerOperation(Summary = "Get the referral program by id (Admin role required)")]
    [HttpGet("program/{id}/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<Domain.Referral.Models.Program> GetProgramById([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(GetProgramById));

      var result = _programService.GetById(id, true, true);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(GetProgramById));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral programs based on the supplied filter (Admin role required)")]
    [HttpPost("program/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ProgramSearchResults> SearchProgram([FromBody] ProgramSearchFilterAdmin filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchProgram));

      var result = _programService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Create a new referral program (Admin role required)")]
    [HttpPost("program/create")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> CreateProgram([FromBody] ProgramRequestCreate request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(CreateProgram));

      var result = await _programService.Create(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(CreateProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the specified referral program (Admin role required)")]
    [HttpPatch("program/update")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateProgram([FromBody] ProgramRequestUpdate request)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgram));

      var result = await _programService.Update(request);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgram));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the referral program image (Admin role required)")]
    [HttpPatch("program/{id}/image")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateProgramImage([FromRoute] Guid id, [Required] IFormFile file)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgramImage));

      var result = await _programService.UpdateImage(id, file);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgramImage));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Update the referral program status (Admin role required)",
      Description = "Support statuses active / inactive / deleted")]
    [HttpPatch("program/{id}/{status}")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> UpdateProgramStatus([FromRoute] Guid id, [FromRoute] Domain.Referral.ProgramStatus status)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(UpdateProgramStatus));

      var result = await _programService.UpdateStatus(id, status);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(UpdateProgramStatus));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Set the specified referral program as the default (Admin role required)",
      Description = "The program must be available world-wide (either with no country restrictions or explicitly including the 'Worldwide' country) in order to be set as default")]
    [HttpPatch("program/{id}/default")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<ActionResult<Domain.Referral.Models.Program>> SetProgramAsDefault([FromRoute] Guid id)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SetProgramAsDefault));

      var result = await _programService.SetAsDefault(id);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SetProgramAsDefault));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search for referral links based on the supplied filter (Admin role required)")]
    [HttpPost("link/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ReferralLinkSearchResults> SearchLink([FromBody] ReferralLinkSearchFilterAdmin filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchLink));

      var result = _linkService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchLink));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search link usages based on the supplied filter (Admin role required)")]
    [HttpPost("link/usage/search/admin")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public ActionResult<ReferralLinkUsageSearchResults> SearchLinkUsage([FromBody] ReferralLinkUsageSearchFilterAdmin filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchLinkUsage));

      var result = _linkUsageService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchLinkUsage));

      return Ok(result);
    }

    [SwaggerOperation(Summary = "Search referral analytics (Admin)",
      Description = "Returns system-wide referral statistics. Link statistics are referrer-only; usage and reward statistics apply to both roles")]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    [HttpPost("analytics/search/admin")]
    public ActionResult<ReferralAnalyticsSearchResults> SearchReferralAnalyticsAdmin([FromBody] ReferralAnalyticsSearchFilterAdmin filter)
    {
      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Handling request {requestName}", nameof(SearchReferralAnalyticsAdmin));

      var result = _analyticsService.Search(filter);

      if (_logger.IsEnabled(LogLevel.Information)) _logger.LogInformation("Request {requestName} handled", nameof(SearchReferralAnalyticsAdmin));

      return Ok(result);
    }
    #endregion
    #endregion
  }
}
