using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/myOpportunity")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, User role required)")]
  public class MyOpportunityController : Controller
  {
    #region Class Variables
    private readonly ILogger<UserController> _logger;
    private readonly IMyOpportunityService _myOpportunityService;
    #endregion

    #region Constructor
    public MyOpportunityController(
        ILogger<UserController> logger,
        IMyOpportunityService myOpportunityService)
    {
      _logger = logger;
      _myOpportunityService = myOpportunityService;
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Get 'my' opportunity by id (Admin or Organization Admin roles required)")]
    [HttpGet("{id}/admin")]
    [ProducesResponseType(typeof(MyOpportunity), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult GetById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetById));

      var result = _myOpportunityService.GetById(id, true, true, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of opportunities sent for verification (Admin or Organization Admin roles required)",
      Description = "With optional organization and/or verification status filtering, returning a lightweight result set/list for search filter input")]
    [HttpGet("search/filter/opportunity")]
    [ProducesResponseType(typeof(List<MyOpportunitySearchCriteriaOpportunity>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult ListMyOpportunityVerificationSearchCriteriaOpportunity([FromQuery] List<Guid>? organizations, [FromQuery] List<VerificationStatus>? verificationStatuses)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListMyOpportunityVerificationSearchCriteriaOpportunity));

      var result = _myOpportunityService.ListMyOpportunityVerificationSearchCriteriaOpportunity(organizations, verificationStatuses, true);

      _logger.LogInformation("Request {requestName} handled", nameof(ListMyOpportunityVerificationSearchCriteriaOpportunity));

      return StatusCode((int)HttpStatusCode.OK, result);
    }


    [SwaggerOperation(Summary = "Search for 'my' opportunities based on the supplied filter (Admin or Organization Admin roles required)")]
    [HttpPost("search/admin")]
    [ProducesResponseType(typeof(MyOpportunitySearchResults), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult Search([FromBody] MyOpportunitySearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _myOpportunityService.Search(filter, true);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Complete or reject manual verification for the specified 'my' opportunity batch (Admin or Organization Admin roles required)")]
    [HttpPatch("verification/finalize/batch")]
    [ProducesResponseType(typeof(MyOpportunityResponseVerifyFinalizeBatch), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> FinalizeVerificationManual([FromBody] MyOpportunityRequestVerifyFinalizeBatch request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(FinalizeVerificationManual));

      await _myOpportunityService.FinalizeVerificationManual(request);

      _logger.LogInformation("Request {requestName} handled", nameof(FinalizeVerificationManual));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Complete or reject manual verification for the specified 'my' opportunity (Admin or Organization Admin roles required)")]
    [HttpPatch("verification/finalize")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> FinalizeVerificationManual([FromBody] MyOpportunityRequestVerifyFinalize request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(FinalizeVerificationManual));

      await _myOpportunityService.FinalizeVerificationManual(request);

      _logger.LogInformation("Request {requestName} handled", nameof(FinalizeVerificationManual));

      return StatusCode((int)HttpStatusCode.OK);
    }
    #endregion Administrative Actions

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Get 'my' opportunity verification status for the specified opportunity (Authenticated User)")]
    [HttpPost("action/verify/status")]
    [ProducesResponseType(typeof(MyOpportunityResponseVerify), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public IActionResult GetVerificationStatus([FromQuery] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetVerificationStatus));

      var result = _myOpportunityService.GetVerificationStatus(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(GetVerificationStatus));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for 'my' opportunities based on the supplied filter (Authenticated User)")]
    [HttpPost("search")]
    [ProducesResponseType(typeof(MyOpportunitySearchResults), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public IActionResult Search([FromBody] MyOpportunitySearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _myOpportunityService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Track viewing of an opportunity (Authenticated User)")]
    [HttpPut("action/{opportunityId}/view")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionViewed([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionViewed));

      await _myOpportunityService.PerformActionViewed(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionViewed));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Save an opportunity (Authenticated User)")]
    [HttpPut("action/{opportunityId}/save")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionSaved([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSaved));

      await _myOpportunityService.PerformActionSaved(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSaved));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Check if an opportunity is saved (Authenticated User)")]
    [HttpGet("action/{opportunityId}/saved")]
    [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public ActionResult ActionedSaved([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSaved));

      var result = _myOpportunityService.ActionedSaved(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSaved));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Remove a saved opportunity (Authenticated User)")]
    [HttpDelete("action/{opportunityId}/save/remove")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionSavedRemove([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSavedRemove));

      await _myOpportunityService.PerformActionSavedRemove(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSavedRemove));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Complete an opportunity by applying for verification (Authenticated User)")]
    [HttpPut("action/{opportunityId}/verify")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionSendForVerificationManual([FromRoute] Guid opportunityId, [FromForm] MyOpportunityRequestVerify request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSendForVerificationManual));

      await _myOpportunityService.PerformActionSendForVerificationManual(opportunityId, request);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSendForVerificationManual));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Complete an opportunity via an instant-verify link (Authenticated User)")]
    [HttpPut("action/link/{linkId}/verify")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionInstantVerificationManual([FromRoute] Guid linkId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionInstantVerificationManual));

      await _myOpportunityService.PerformActionInstantVerificationManual(linkId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionInstantVerificationManual));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Delete a pending verification request for an opportunity (Authenticated User)")]
    [HttpDelete("action/{opportunityId}/verify/delete")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionSendForVerificationManualDelete([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSendForVerificationManualDelete));

      await _myOpportunityService.PerformActionSendForVerificationManualDelete(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSendForVerificationManualDelete));

      return StatusCode((int)HttpStatusCode.OK);
    }
    #endregion Authenticated User Based Actions
    #endregion
  }
}
