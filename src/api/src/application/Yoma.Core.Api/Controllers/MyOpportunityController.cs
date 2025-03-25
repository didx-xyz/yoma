using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Models;
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

    [SwaggerOperation(Summary = "Search for 'my' opportunities based on the supplied filter, and export the results to a CSV file (Admin or Organization Admin roles required)",
      Description = "If pagination is not specified, the request is scheduled for processing, and a notification is sent when the download is ready")]
    [HttpPost("search/admin/csv")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileStreamResult), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.OK)] // delayed download delivered via email
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> ExportOrScheduleToCSV([FromBody] MyOpportunitySearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ExportOrScheduleToCSV));

      var (scheduleForProcessing, fileName, bytes) = await _myOpportunityService.ExportOrScheduleToCSV(filter, true);

      _logger.LogInformation("Request {requestName} handled", nameof(ExportOrScheduleToCSV));

      if (scheduleForProcessing) return StatusCode((int)HttpStatusCode.OK);
      return File(bytes!, "text/csv", fileName);
    }

    [SwaggerOperation(Summary = "Complete or reject manual verification for the specified 'my' opportunity batch (Admin or Organization Admin roles required)")]
    [HttpPatch("verification/finalize/batch")]
    [ProducesResponseType(typeof(MyOpportunityResponseVerifyFinalizeBatch), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> FinalizeVerificationManual([FromBody] MyOpportunityRequestVerifyFinalizeBatch request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(FinalizeVerificationManual));

      var result = await _myOpportunityService.FinalizeVerificationManual(request);

      _logger.LogInformation("Request {requestName} handled", nameof(FinalizeVerificationManual));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Complete or reject manual verification for the specified 'my' opportunity (Admin or Organization Admin roles required)")]
    [HttpPatch("verification/finalize")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> FinalizeVerificationManual([FromBody] MyOpportunityRequestVerifyFinalize request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(FinalizeVerificationManual));

      await _myOpportunityService.FinalizeVerificationManual(request);

      _logger.LogInformation("Request {requestName} handled", nameof(FinalizeVerificationManual));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Import completions for the specified organization from a CSV file (Admin or Organization Admin roles required)")]
    [HttpPost("action/verify/csv")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> PerformActionImportVerificationFromCSV([FromForm] MyOpportunityRequestVerifyImportCsv request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionImportVerificationFromCSV));

      await _myOpportunityService.PerformActionImportVerificationFromCSV(request, true);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionImportVerificationFromCSV));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Download all verification files associated with the opportunity for all completed submissions (Admin or Organization Admin roles required)",
      Description = "The request is scheduled for processing, and a notification is sent when the download is ready")]
    [HttpPost("action/verify/admin/files")]
    [Produces("application/zip")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> DownloadVerificationFilesAdmin([FromBody] MyOpportunitySearchFilterVerificationFiles filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(DownloadVerificationFiles));

      await _myOpportunityService.DownloadVerificationFilesSchedule(filter, true);

      _logger.LogInformation("Request {requestName} handled", nameof(DownloadVerificationFiles));

      return StatusCode((int)HttpStatusCode.OK);
    }
    #endregion Administrative Actions

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Get 'my' opportunity verification status for the specified opportunity (Authenticated User)")]
    [HttpGet("action/{opportunityId}/verify/status")]
    [ProducesResponseType(typeof(MyOpportunityResponseVerifyStatus), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public IActionResult GetVerificationStatus([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetVerificationStatus));

      var result = _myOpportunityService.GetVerificationStatus(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(GetVerificationStatus));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Download the uploaded 'my' opportunity verification files for specified opportunity (Authenticated User)")]
    [HttpPost("action/verify/files")]
    [ProducesResponseType(typeof(FileStreamResult), (int)HttpStatusCode.OK)]
    [Produces("application/octet-stream")] //various file types
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> DownloadVerificationFiles([FromBody] MyOpportunitySearchFilterVerificationFiles filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(DownloadVerificationFiles));

      var file = await _myOpportunityService.DownloadVerificationFiles(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(DownloadVerificationFiles));

      return File(file.ToBinary(), file.ContentType, file.FileName);
    }

    [SwaggerOperation(Summary = "Search for 'my' opportunities based on the supplied filter (Authenticated User)")]
    [HttpPost("search")]
    [ProducesResponseType(typeof(MyOpportunitySearchResults), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public IActionResult Search([FromBody] MyOpportunitySearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _myOpportunityService.Search(filter, null);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a time-based summary of 'my' opportunities (Authenticated User)")]
    [HttpGet("summary")]
    [ProducesResponseType(typeof(TimeIntervalSummary), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public IActionResult GetSummary()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetSummary));

      var result = _myOpportunityService.GetSummary();

      _logger.LogInformation("Request {requestName} handled", nameof(GetSummary));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Track viewing of an opportunity (Authenticated User)")]
    [HttpPut("action/{opportunityId}/view")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
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
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionSaved([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSaved));

      await _myOpportunityService.PerformActionSaved(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSaved));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Track navigating to the external link of an opportunity (Authenticated User)")]
    [HttpPut("action/{opportunityId}/navigateExternalLink")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionNavigatedExternalLink([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionNavigatedExternalLink));

      await _myOpportunityService.PerformActionNavigatedExternalLink(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionNavigatedExternalLink));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Check if an opportunity is saved (Authenticated User)")]
    [HttpGet("action/{opportunityId}/saved")]
    [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
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
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionInstantVerification([FromRoute] Guid linkId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionInstantVerification));

      await _myOpportunityService.PerformActionInstantVerification(linkId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionInstantVerification));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Delete a pending verification request for an opportunity (Authenticated User)")]
    [HttpDelete("action/{opportunityId}/verify/delete")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> PerformActionSendForVerificationManualDelete([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSendForVerificationManualDelete));

      await _myOpportunityService.PerformActionSendForVerificationManualDelete(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSendForVerificationManualDelete));

      return StatusCode((int)HttpStatusCode.OK);
    }
    #endregion Authenticated User Based Actions
    #endregion Public Members
  }
}
