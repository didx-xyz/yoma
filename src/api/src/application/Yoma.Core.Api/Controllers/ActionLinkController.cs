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
    [SwaggerOperation(Summary = "Get or create a sharing link for a published or expired entity by id (Anonymous)",
     Description = "Optionally include a QR code")]
    [HttpPost("create/sharing")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public async Task<IActionResult> GetOrCreateLinkSharing([FromBody] LinkRequestCreateShare request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetOrCreateLinkSharing));

      var result = await _linkService.GetOrCreateShare(request, true, false);

      _logger.LogInformation("Request {requestName} handled", nameof(GetOrCreateLinkSharing));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Anonymous Actions

    #region Administrative Actions
    [SwaggerOperation(Summary = "Create an instant-verify link")]
    [HttpPost("create/instantVerify")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> CreateLinkInstantVerify([FromBody] LinkRequestCreateVerify request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateLinkInstantVerify));

      var result = await _linkService.CreateVerify(request, false, true);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateLinkInstantVerify));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Get the link by id",
      Description = "Optionally include a QR code")]
    [HttpGet("{linkId}")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
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

    [SwaggerOperation(Summary = "Update link status",
      Description = "An Admin have the power to activate, deactivate, decline or delete a link, whilst an Organization Admin can only delete. With a decline, an approval comment is required")]
    [HttpPatch("{linkId}/status")]
    [ProducesResponseType(typeof(LinkInfo), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid linkId, [FromBody] LinkRequestUpdateStatus request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

      var result = await _linkService.UpdateStatus(linkId, request, true);
      _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Administrative Actions
    #endregion
  }
}
