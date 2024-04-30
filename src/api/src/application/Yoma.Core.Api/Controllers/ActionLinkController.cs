using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using Yoma.Core.Domain.ActionLink.Interfaces;
using System.Net;
using Yoma.Core.Domain.ActionLink.Models;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.ActionLink;

namespace Yoma.Core.Api.Controllers
{

  [Route($"api/{Common.Constants.Api_Version}/actionLink")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin or Organization Admin roles required)")]
  public class ActionLinkController : Controller
  {
    #region Class Variables
    private readonly ILogger<ActionLinkController> _logger;
    private readonly ILinkService _linkService;
    #endregion

    #region Constructor
    public ActionLinkController(
        ILogger<ActionLinkController> logger,
        ILinkService linkService)
    {
      _logger = logger;
      _linkService = linkService;
    }
    #endregion

    #region Public Members
    #region Anonymous Actions
    [SwaggerOperation(Summary = "Create a sharing link for a published or expired entity by id (Anonymous)",
     Description = "Optionally include a QR code")]
    [HttpPost("create/sharing")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [AllowAnonymous]
    public async Task<IActionResult> CreateLinkSharing([FromBody] LinkRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateLinkSharing));

      request.Action = LinkAction.Share;
      var result = await _linkService.Create(request, true, false);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateLinkSharing));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Anonymous Actions

    #region Administrative Actions
    [SwaggerOperation(Summary = "Create an instant-verify link")]
    [HttpPost("create/instantVerify")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> CreateLinkInstantVerify([FromBody] LinkRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateLinkInstantVerify));

      request.Action = LinkAction.Verify;
      var result = await _linkService.Create(request, false, true);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateLinkInstantVerify));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Get the link by id",
      Description = "Optionally include a QR code")]
    [HttpGet("{linkId}")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult GetById([FromRoute] Guid linkId, [FromQuery] bool? includeQRCode)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetById));

      var result = _linkService.GetById(linkId, true, includeQRCode);
      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for links based on the supplied filter")]
    [HttpPost("search")]
    [ProducesResponseType(typeof(LinkSearchResult), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult Search([FromBody] LinkSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _linkService.Search(filter, true);
      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update link status (Active / Inactive)",
      Description = "Activate an inactive link, provided the end date has not been reached or deactivate an active link")]
    [HttpPatch("{linkId}/status/{status}")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid linkId, [FromRoute] LinkStatus status)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

      var result = await _linkService.UpdateStatus(linkId, status, true);
      _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion
    #endregion
  }
}
