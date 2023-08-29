using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.MyOpportunity;
using Yoma.Core.Domain.MyOpportunity.Interfaces;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/user")]
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
        [HttpPut("verification/{userId}/{opportunityId}/update/{status}")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> CompleteVerification([FromRoute] Guid userId, [FromRoute] Guid opportunityId, [FromRoute] VerificationStatus status)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(CompleteVerification));

            await _myOpportunityService.CompleteVerification(userId, opportunityId, status);

            _logger.LogInformation("Request {requestName} handled", nameof(CompleteVerification));

            return StatusCode((int)HttpStatusCode.OK);
        }
        #endregion Administrative Actions

        #region Authenticated User Based Actions
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
        public async Task<IActionResult> PerformActionSendForVerification([FromRoute] Guid opportunityId, [FromBody] MyOpportunityVerifyRequest request)
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
