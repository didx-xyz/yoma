using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Api.Common;

namespace Yoma.Core.Api.Controllers
{
  [ApiExplorerSettings(IgnoreApi = true)]
  [Route($"api/{Constants.Api_Version}/externalpartner")]
  [ApiController]
  [Authorize(Policy = Constants.Authorization_Policy_External_Partner)]
  [SwaggerTag("(by default, requires an external partner bearer token obtained via the Client Credentials flow)")]
  public class ExternalPartnerController : Controller
  {
    #region Class Variables
    #endregion

    #region Constructor
    public ExternalPartnerController()
    {
    }
    #endregion

    #region Public Members
    #region Authenticated Actions
    [SwaggerOperation(Summary = "Test authentication and return 'OK'")]
    [HttpGet("test/action")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    public IActionResult TestAction()
    {
      return StatusCode((int)HttpStatusCode.OK);
    }
    #endregion Authenticated Actions
    #endregion Public Members
  }
}

