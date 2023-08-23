using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Entity;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/organization")]
    [ApiController]
    [Authorize(Policy = Common.Constants.Authorization_Policy, Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    [SwaggerTag("(by default, Admin or Organization Admin roles required)")]
    public class OrganizationController : Controller
    {
        #region Class Variables
        private readonly ILogger<OrganizationController> _logger;
        private readonly IOrganizationService _organizationService;
        private readonly IOrganizationProviderTypeService _providerTypeService;
        #endregion

        #region Constructor
        public OrganizationController(
            ILogger<OrganizationController> logger,
            IOrganizationService organizationService,
            IOrganizationProviderTypeService providerTypeService)
        {
            _logger = logger;
            _organizationService = organizationService;
            _providerTypeService = providerTypeService;
        }
        #endregion

        #region Public Members
        #region Administrative Actions
        [SwaggerOperation(Summary = "Get the specified organization by id")]
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        public IActionResult GetById([FromRoute] Guid id)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(GetById));

            var result = _organizationService.GetById(id, true, true);

            _logger.LogInformation("Request {requestName} handled", nameof(GetById));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for organizations based on the supplied filter (Admin role required)")]
        [HttpPost("search")]
        [ProducesResponseType(typeof(List<OrganizationSearchResults>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = Constants.Role_Admin)]
        public IActionResult Search([FromBody] OrganizationSearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Search));

            var result = _organizationService.Search(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(Search));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Insert or update an organization (User, Admin or Organization Admin role required)",
            Description = "The newly created organization defaults to an unapproved (unverified) state. When the authenticated user solely holds the 'User' role, an organization can be created, and the user is automatically designated the role of an 'Organization Admin'.")]
        [HttpPost()]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}, {Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> Upsert([FromBody] OrganizationRequest request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Upsert));

            var result = await _organizationService.Upsert(request, true);

            _logger.LogInformation("Request {requestName} handled", nameof(Upsert));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update organization status (Active / Inactive / Declined / Deleted)")]
        [HttpPut("{id}/{status}")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromRoute] OrganizationStatus status)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

            await _organizationService.UpdateStatus(id, status, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

            return StatusCode((int)HttpStatusCode.OK);
        }

        [SwaggerOperation(Summary = "Return a list of provider types")]
        [HttpGet("lookup/providerType")]
        [ProducesResponseType(typeof(List<Domain.Entity.Models.Lookups.OrganizationProviderType>), (int)HttpStatusCode.OK)]
        public IActionResult ListProviderTypes()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListProviderTypes));

            var result = _providerTypeService.List();

            _logger.LogInformation("Request {requestName} handled", nameof(ListProviderTypes));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Assign provider type(s) to the specified organization")]
        [HttpPut("{id}/providerTypes/assign")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> AssignProviderTypes([FromRoute] Guid id, [FromBody] List<Guid> providerTypeIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(AssignProviderTypes));

            await _organizationService.AssignProviderTypes(id, providerTypeIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(AssignProviderTypes));

            return StatusCode((int)HttpStatusCode.OK);
        }

        [SwaggerOperation(Summary = "Remove provider type(s) from the specified organization")]
        [HttpDelete("{id}/providerTypes/remove")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> DeleteProviderType([FromRoute] Guid id, [FromBody] List<Guid> providerTypeIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(DeleteProviderType));

            await _organizationService.DeleteProviderTypes(id, providerTypeIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(DeleteProviderType));

            return StatusCode((int)HttpStatusCode.OK);
        }

        [SwaggerOperation(Summary = "Insert or update the organization's logo")]
        [HttpPost("{id}/logo")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> UpsertLogo([FromRoute] Guid id, [Required] IFormFile file)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpsertLogo));

            var result = await _organizationService.UpsertLogo(id, file, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpsertLogo));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Insert or update the organization's registration document")]
        [HttpPost("{id}/registrationDocument")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        public async Task<IActionResult> UpsertRegistrationDocument([FromRoute] Guid id, [Required] IFormFile file)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpsertRegistrationDocument));

            var result = await _organizationService.UpsertRegistrationDocument(id, file, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpsertRegistrationDocument));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Assign the specified user as organization administrator")]
        [HttpPut("{id}/admin/{userId}/assign")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> AssignAdmin([FromRoute] Guid id, [FromRoute] Guid userId)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(AssignAdmin));

            await _organizationService.AssignAdmin(id, userId, true);

            _logger.LogInformation("Request {requestName} handled", nameof(AssignAdmin));

            return StatusCode((int)HttpStatusCode.OK);
        }

        [SwaggerOperation(Summary = "Remove the specified user as organization administrator")]
        [HttpDelete("{id}/admin/{userId}/remove")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        public async Task<IActionResult> RemoveAdmin([FromRoute] Guid id, [FromRoute] Guid userId)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(RemoveAdmin));

            await _organizationService.RemoveAdmin(id, userId, true);

            _logger.LogInformation("Request {requestName} handled", nameof(RemoveAdmin));

            return StatusCode((int)HttpStatusCode.OK);
        }

        [SwaggerOperation(Summary = "Return a list of administrators for the specified organization")]
        [HttpGet("{id}/admin")]
        [ProducesResponseType(typeof(List<Domain.Entity.Models.Lookups.OrganizationProviderType>), (int)HttpStatusCode.OK)]
        public IActionResult ListAdmins([FromRoute] Guid id)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListAdmins));

            var result = _organizationService.ListAdmins(id, true);

            _logger.LogInformation("Request {requestName} handled", nameof(ListAdmins));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of organizations the authenticated user administrates (Organization Admin role required)")]
        [HttpGet("admin")]
        [ProducesResponseType(typeof(List<Domain.Entity.Models.Lookups.OrganizationProviderType>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = Constants.Role_OrganizationAdmin)]
        public IActionResult ListAdminsOf()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListAdminsOf));

            var result = _organizationService.ListAdminsOf();

            _logger.LogInformation("Request {requestName} handled", nameof(ListAdminsOf));

            return StatusCode((int)HttpStatusCode.OK, result);
        }
        #endregion Administrative Actions
        #endregion
    }
}
