using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Api.Common;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Constants.Api_Version}/externalpartner")]
  [ApiController]
  [Authorize(Policy = Constants.Authorization_Policy_External_Partner)]
  [SwaggerTag("(by default, requires an external partner bearer token obtained via the Client Credentials flow)")]
  public class ExternalPartnerController : Controller
  {
    #region Class Variables
    private readonly ILogger<UserController> _logger;
    private readonly IMyOpportunityService _myOpportunityService;
    #endregion

    #region Constructor
    public ExternalPartnerController(
        ILogger<UserController> logger,
        IMyOpportunityService myOpportunityService)
    {
      _logger = logger;
      _myOpportunityService = myOpportunityService;
    }
    #endregion

    #region Public Members
    #region Authenticated Actions
    [SwaggerOperation(Summary = "Get a list of users who completed verification for the specified opportunity",
      Description = "Returns a list of users who have completed verification for the specified opportunity, including the date of completion. No user completions will be returned if the opportunity is not shared with partners. Additionally, users who opted not to share their email will not be included in the response")]
    [HttpGet("opportunity/{opportunityId}/verify/completed")]
    [ProducesResponseType(typeof(MyOpportunityResponseVerifyCompletedExternal), (int)HttpStatusCode.OK)]
    public IActionResult GetVerificationStatus([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetVerificationStatus));

      var result = _myOpportunityService.GetVerificationCompletedExternal(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(GetVerificationStatus));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Authenticated Actions
    #endregion Public Members
  }
}

