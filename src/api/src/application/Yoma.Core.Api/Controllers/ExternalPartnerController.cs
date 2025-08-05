using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Api.Common;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Constants.Api_Version}/externalpartner")]
  [ApiController]
  [Authorize(Policy = Constants.Authorization_Policy_External_Partner)]
  [SwaggerTag("(by default, requires an external partner bearer token obtained via the Client Credentials flow)")]
  public class ExternalPartnerController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<UserController> _logger;
    private readonly IMyOpportunityService _myOpportunityService;
    private readonly IUserProfileService _userProfileService;
    #endregion

    #region Constructor
    public ExternalPartnerController(
        ILogger<UserController> logger,
        IMyOpportunityService myOpportunityService,
        IUserProfileService userProfileService)
    {
      _logger = logger;
      _myOpportunityService = myOpportunityService;
      _userProfileService = userProfileService;
    }
    #endregion

    #region Public Members
    #region Authenticated Actions
    [SwaggerOperation(Summary = "Get a list of users who completed verification for the specified opportunity",
      Description = "Returns a list of users who have completed verification for the specified opportunity, including the date of completion. No user completions will be returned if the opportunity is not shared with partners. Additionally, users who opted not to share their email will not be included in the response")]
    [HttpGet("opportunity/{opportunityId}/verify/completed")]
    [ProducesResponseType(typeof(MyOpportunityResponseVerifyCompletedExternal), (int)HttpStatusCode.OK)]
    public IActionResult OpportunityGetVerificationStatus([FromRoute] Guid opportunityId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(OpportunityGetVerificationStatus));

      var result = _myOpportunityService.GetVerificationCompletedExternal(opportunityId);

      _logger.LogInformation("Request {requestName} handled", nameof(OpportunityGetVerificationStatus));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Create a user profile",
      Description = "Creates the user in both the identity provider and Yoma. Either a phone number or an email address must be provided. " +
                    "Both are initially unconfirmed. Phone number will be verified upon first login using OTP. " +
                    "If an email address is provided, a verification email will be sent. " +
                    "A strong temporary password is generated, and the user will be prompted to change it on first login.")]
    [HttpPost("user")]
    [ProducesResponseType(typeof(UserProfile), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> UserCreateProfile([FromBody] UserRequestCreateProfile request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UserCreateProfile));

      var result = await _userProfileService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UserCreateProfile));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Authenticated Actions
    #endregion Public Members
  }
}

