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
  public class UserController : Controller
  {
    #region Class Variables
    private readonly ILogger<UserController> _logger;
    private readonly IUserService _userService;
    #endregion

    #region Constructor
    public UserController(
        ILogger<UserController> logger,
        IUserService userService)
    {
      _logger = logger;
      _userService = userService;
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Get the specified user by id (Admin role required)")]
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(User), (int) HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public IActionResult GetById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName}: {paramValue})", nameof(GetById), nameof(id), id);

      var result = _userService.GetById(id);

      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return StatusCode((int) HttpStatusCode.OK, result);
    }
    #endregion Administrative Actions

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Get the user (Authenticated User)")]
    [HttpGet("")]
    [ProducesResponseType(typeof(User), (int) HttpStatusCode.OK)]
    public IActionResult Get()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Get));

      var result = _userService.GetByEmail(HttpContext.User.Identity?.Name);

      _logger.LogInformation("Request {requestName} handled", nameof(Get));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update the user's profile, within Yoma and the identity provider, optionally requesting a email verification and/or password reset (Authenticated User)")]
    [HttpPatch()]
    [ProducesResponseType(typeof(User), (int) HttpStatusCode.OK)]
    public async Task<IActionResult> UpdateProfile([FromBody] UserProfileRequest profile)
    {
      _logger.LogInformation("Handling request {requestName} (Username: {paramValue}", nameof(UpdateProfile), HttpContext.User.Identity?.Name);

      var result = await _userService.UpdateProfile(HttpContext.User.Identity?.Name, profile);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateProfile));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Insert or update the user's profile photo (Authenticated User)")]
    [HttpPost("photo")]
    [ProducesResponseType(typeof(User), (int) HttpStatusCode.OK)]
    public async Task<IActionResult> UpsertPhoto([Required] IFormFile file)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName}: {paramValue})", nameof(UpsertPhoto), nameof(file.Name), file?.Name);

      var result = await _userService.UpsertPhoto(HttpContext.User.Identity?.Name, file);

      _logger.LogInformation("Request {requestName} handled", nameof(UpsertPhoto));

      return StatusCode((int) HttpStatusCode.OK, result);
    }
    #endregion Authenticated User Based Actions
    #endregion
  }
}
