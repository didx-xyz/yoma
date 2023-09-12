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
    [Authorize(Policy = Common.Constants.Authorization_Policy)]
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
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult GetById([FromRoute] Guid id)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(GetById));

            var result = _organizationService.GetById(id, true, true);

            _logger.LogInformation("Request {requestName} handled", nameof(GetById));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for organizations based on the supplied filter (Admin role required)")]
        [HttpPost("search")]
        [ProducesResponseType(typeof(OrganizationSearchResults), (int)HttpStatusCode.OK)]
        [Authorize(Roles = Constants.Role_Admin)]
        public IActionResult Search([FromBody] OrganizationSearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Search));

            var result = _organizationService.Search(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(Search));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Create a new organization (User, Admin or Organization Admin role required)")]
        [HttpPost()]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}, {Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> Create([FromForm] OrganizationRequestCreate request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Create));

            var result = await _organizationService.Create(request);

            _logger.LogInformation("Request {requestName} handled", nameof(Create));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update the specified organization")]
        [HttpPatch()]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> Update([FromForm] OrganizationRequestUpdate request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Update));

            var result = await _organizationService.Update(request, true);

            _logger.LogInformation("Request {requestName} handled", nameof(Update));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update organization status",
            Description = $"An Admin have the power to activate, deactivate, decline or delete an organization, whilst an Organization Admin can only delete. With a decline, an approval comment is required")]
        [HttpPatch("{id}/status")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] OrganizationRequestUpdateStatus request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

            var result = await _organizationService.UpdateStatus(id, request, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of provider types (User, Admin or Organization Admin role required)")]
        [HttpGet("lookup/providerType")]
        [ProducesResponseType(typeof(List<Domain.Entity.Models.Lookups.OrganizationProviderType>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}, {Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult ListProviderTypes()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListProviderTypes));

            var result = _providerTypeService.List();

            _logger.LogInformation("Request {requestName} handled", nameof(ListProviderTypes));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Assign provider type(s) to the specified organization")]
        [HttpPatch("{id}/assign/providerTypes")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> AssignProviderTypes([FromRoute] Guid id, [Required][FromBody] List<Guid> providerTypeIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(AssignProviderTypes));

            var result = await _organizationService.AssignProviderTypes(id, providerTypeIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(AssignProviderTypes));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Remove provider type(s) from the specified organization")]
        [HttpPatch("{id}/remove/providerTypes")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> RemoveProviderTypes([FromRoute] Guid id, [Required][FromBody] List<Guid> providerTypeIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(RemoveProviderTypes));

            var result = await _organizationService.RemoveProviderTypes(id, providerTypeIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(RemoveProviderTypes));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update the organization's logo")]
        [HttpPatch("{id}/logo")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateLogo([FromRoute] Guid id, [Required] IFormFile file)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateLogo));

            var result = await _organizationService.UpdateLogo(id, file, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateLogo));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Add document(s) for the specified organization's")]
        [HttpPatch("{id}/documents/{type}")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> AddDocuments([FromRoute] Guid id, [FromRoute] OrganizationDocumentType type, [Required] List<IFormFile> documents)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(AddDocuments));

            var result = await _organizationService.AddDocuments(id, type, documents, true);

            _logger.LogInformation("Request {requestName} handled", nameof(AddDocuments));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Delete document(s) from the specified organization")]
        [HttpDelete("{id}/documents/{type}")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> DeleteDocuments([FromRoute] Guid id, [FromRoute] OrganizationDocumentType type, [Required] List<Guid> documentIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(DeleteDocuments));

            var result = await _organizationService.DeleteDocuments(id, type, documentIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(DeleteDocuments));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Assign administrators to the specified organization")]
        [HttpPatch("{id}/assign/admins")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> AssignAdmins([FromRoute] Guid id, [FromRoute] List<string> emails)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(AssignAdmins));

            var result = await _organizationService.AssignAdmins(id, emails, true);

            _logger.LogInformation("Request {requestName} handled", nameof(AssignAdmins));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Remove administrators from the specified organization")]
        [HttpPatch("{id}/remove/admins")]
        [ProducesResponseType(typeof(Organization), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> RemoveAdmins([FromRoute] Guid id, [FromRoute] List<string> emails)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(RemoveAdmins));

            var result = await _organizationService.RemoveAdmins(id, emails, true);

            _logger.LogInformation("Request {requestName} handled", nameof(RemoveAdmins));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of administrators for the specified organization")]
        [HttpGet("{id}/admin")]
        [ProducesResponseType(typeof(List<UserInfo>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult ListAdmins([FromRoute] Guid id)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListAdmins));

            var result = _organizationService.ListAdmins(id, true);

            _logger.LogInformation("Request {requestName} handled", nameof(ListAdmins));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of organizations the authenticated user administrates (Organization Admin role required)")]
        [HttpGet("admin")]
        [ProducesResponseType(typeof(List<OrganizationInfo>), (int)HttpStatusCode.OK)]
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
