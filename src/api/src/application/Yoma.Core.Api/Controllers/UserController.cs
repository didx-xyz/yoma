using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route("api/v3/user")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, User role required)")]
  public class UserController : Controller
  {
    #region Class Variables
    private readonly ILogger<UserController> _logger;
    private readonly IUserService _userService;
    private readonly IUserProfileService _userProfileService;
    #endregion

    #region Constructor
    public UserController(
        ILogger<UserController> logger,
        IUserService userService,
        IUserProfileService userProfileService)
    {
      _logger = logger;
      _userService = userService;
      _userProfileService = userProfileService;
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Get the specified user by id (Admin role required)")]
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(User), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = Constants.Role_Admin)]
    public IActionResult GetById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetById));

      var result = _userService.GetById(id, true, true);

      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for users based on the supplied filter (Admin or Organization Admin roles required)")]
    [HttpPost("search")]
    [ProducesResponseType(typeof(UserSearchResults), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult Search([FromBody] UserSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _userService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Administrative Actions

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Get the user (Authenticated User)")]
    [HttpGet("")]
    [ProducesResponseType(typeof(UserProfile), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public IActionResult Get()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Get));

      var result = _userProfileService.Get();

      _logger.LogInformation("Request {requestName} handled", nameof(Get));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update the user's profile, within Yoma and the identity provider, optionally requesting a email verification and/or password reset (Authenticated User)")]
    [HttpPatch()]
    [ProducesResponseType(typeof(UserProfile), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> UpdateProfile([FromBody] UserRequestProfile request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateProfile));

      var result = await _userProfileService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateProfile));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Insert or update the user's profile photo (Authenticated User)")]
    [HttpPatch("photo")]
    [ProducesResponseType(typeof(UserProfile), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> UpsertPhoto([Required] IFormFile file)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpsertPhoto));

      var result = await _userProfileService.UpsertPhoto(file);

      _logger.LogInformation("Request {requestName} handled", nameof(UpsertPhoto));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Complete YoID onboarding (Authenticated User)")]
    [HttpPatch("yoId")]
    [ProducesResponseType(typeof(UserProfile), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> YoIDOnboard()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(YoIDOnboard));

      var result = await _userProfileService.YoIDOnboard();

      _logger.LogInformation("Request {requestName} handled", nameof(YoIDOnboard));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Authenticated User Based Actions
    #endregion
  }
}
