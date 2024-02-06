using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/externalpartner")]
    [ApiController]
    [Authorize(Policy = Common.Constants.Authorization_Policy_External_Partner)]
    [SwaggerTag("By default, obtain an external partner bearer token via the Client Credentials flow")]
    public class ExternalPartnerController : Controller
    {
        [HttpGet()]
        public IActionResult TestAction()
        {
            return StatusCode((int)HttpStatusCode.OK);
        }
    }
}

