using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/myopportunity")]
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
        [SwaggerOperation(Summary = "Reject or complete verification for the specified 'my' opportunity (Admin or Organization Admin roles required)")]
        [HttpPatch("verification/{opportunityId}/finalize")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> FinalizeVerification([FromRoute] Guid opportunityId, [FromBody] MyOpportunityRequestVerifyFinalize request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(FinalizeVerification));

            await _myOpportunityService.FinalizeVerification(opportunityId, request);

            _logger.LogInformation("Request {requestName} handled", nameof(FinalizeVerification));

            return StatusCode((int)HttpStatusCode.OK);
        }
        #endregion Administrative Actions

        #region Authenticated User Based Actions
        [SwaggerOperation(Summary = "Search for 'my' opportunities based on the supplied filter")]
        [HttpPost("search")]
        [ProducesResponseType(typeof(List<MyOpportunitySearchResults>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}")]
        public IActionResult Search([FromBody] MyOpportunitySearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Search));

            var result = _myOpportunityService.Search(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(Search));

            return StatusCode((int)HttpStatusCode.OK, result);
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

        [SwaggerOperation(Summary = "Remove a saved opportunity (Authenticated User)")]
        [HttpPut("action/{opportunityId}/save/remove")]
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
        public async Task<IActionResult> PerformActionSendForVerification([FromRoute] Guid opportunityId, [FromForm] MyOpportunityRequestVerify request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(PerformActionSendForVerification));

            await _myOpportunityService.PerformActionSendForVerification(opportunityId, request);

            _logger.LogInformation("Request {requestName} handled", nameof(PerformActionSendForVerification));

            return StatusCode((int)HttpStatusCode.OK);
        }
        #endregion Authenticated User Based Actions
        #endregion
    }
}
