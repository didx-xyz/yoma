using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Entity.Interfaces.Lookups;
using Yoma.Core.Domain.Entity.Models;

namespace Yoma.Core.Api.Controllers
{
  /* TODO:
      - User organization registration (User role only)
      - Approve / Declined
      - Request verification
      - Search (by admin and / or name)
  */

  [Route("api/v3/organization")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy, Roles = $"{Constants.Role_Admin},{Constants.Role_OrganizationAdmin}")]
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
    [ProducesResponseType(typeof(Organization), (int) HttpStatusCode.OK)]
    public IActionResult GetById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName} {paramName}: {paramValue})", nameof(GetById), nameof(id), id);

      var result = _organizationService.GetById(id);

      _logger.LogInformation("Request {requestName} handled", nameof(GetById));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Insert or update an organization (User, Admin or Organization Admin role required)",
        Description = "Newly created organization defaults to an unapproved (unverified) state. A user can only create an organization and is automatically assigned the role of Organization Admin.")]
    [HttpPost()]
    [ProducesResponseType(typeof(Organization), (int) HttpStatusCode.OK)]
    public async Task<IActionResult> Upsert([FromBody] OrganizationRequest request)
    {
      _logger.LogInformation("Handling request {requestName} {paramName}: {paramValue}",
          nameof(Upsert), nameof(request), !request.Id.HasValue ? "insert" : $"update: {request.Id.Value}");

      var result = await _organizationService.Upsert(request);

      _logger.LogInformation("Request {requestName} handled", nameof(Upsert));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of provider types")]
    [HttpGet("lookup/providerType")]
    [ProducesResponseType(typeof(List<Domain.Entity.Models.Lookups.OrganizationProviderType>), (int) HttpStatusCode.OK)]
    public IActionResult ListProviderTypes()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListProviderTypes));

      var result = _providerTypeService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListProviderTypes));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "List the provider types for specified organization")]
    [HttpGet("{id}/providerType")]
    [ProducesResponseType(typeof(List<Domain.Entity.Models.Lookups.OrganizationProviderType>), (int) HttpStatusCode.OK)]
    public IActionResult ListProviderTypesById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName} {paramName}: {paramValue})", nameof(ListProviderTypesById), nameof(id), id);

      var result = _organizationService.ListProviderTypesById(id);

      _logger.LogInformation("Request {requestName} handled", nameof(ListProviderTypesById));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Assign provider type(s) to the specified organization")]
    [HttpPut("{id}/assign/providerTypes")]
    [ProducesResponseType((int) HttpStatusCode.OK)]
    public async Task<IActionResult> AssignProviderType([FromRoute] Guid id, [FromBody] List<Guid> providerTypeIds)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName1}: {paramValue1} | {paramName2}: {paramValue2})",
          nameof(AssignProviderType), nameof(id), id, nameof(providerTypeIds), providerTypeIds);

      await _organizationService.AssignProviderTypes(id, providerTypeIds);

      _logger.LogInformation("Request {requestName} handled", nameof(AssignProviderType));

      return StatusCode((int) HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Remove provider type(s) from the specified organization (Admin role required)")]
    [HttpDelete("{id}/remove/providerTypes")]
    [ProducesResponseType((int) HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public async Task<IActionResult> DeleteProviderType([FromRoute] Guid id, [FromBody] List<Guid> providerTypeIds)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName1}: {paramValue1} | {paramName2}: {paramValue2})",
       nameof(DeleteProviderType), nameof(id), id, nameof(providerTypeIds), providerTypeIds);

      await _organizationService.DeleteProviderTypes(id, providerTypeIds);

      _logger.LogInformation("Request {requestName} handled", nameof(DeleteProviderType));

      return StatusCode((int) HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Insert or update the organization's logo")]
    [HttpPost("{id}/logo")]
    [ProducesResponseType(typeof(Organization), (int) HttpStatusCode.OK)]
    public async Task<IActionResult> UpsertLogo([FromRoute] Guid id, [Required] IFormFile file)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName}: {paramValue})", nameof(UpsertLogo), nameof(file.Name), file?.Name);

      var result = await _organizationService.UpsertLogo(id, file);

      _logger.LogInformation("Request {requestName} handled", nameof(UpsertLogo));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Insert or update the organization's registration document")]
    [HttpPost("{id}/registrationDocument")]
    [ProducesResponseType(typeof(Organization), (int) HttpStatusCode.OK)]
    public async Task<IActionResult> UpsertRegistrationDocument([FromRoute] Guid id, [Required] IFormFile file)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName}: {paramValue})", nameof(UpsertRegistrationDocument), nameof(file.Name), file?.Name);

      var result = await _organizationService.UpsertRegistrationDocument(id, file);

      _logger.LogInformation("Request {requestName} handled", nameof(UpsertRegistrationDocument));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Assign the specified user as organization administrator (Admin role required)")]
    [HttpPut("{id}/assign/{userId}/admin")]
    [ProducesResponseType((int) HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public IActionResult AssignAdmin([FromRoute] Guid id, [FromRoute] Guid userId)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName1}: {paramValue1} | {paramName2}: {paramValue2})",
          nameof(AssignAdmin), nameof(id), id, nameof(userId), userId);

      var result = _organizationService.AssignAdmin(id, userId);

      _logger.LogInformation("Request {requestName} handled", nameof(AssignAdmin));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Remove the specified user as organization administrator (Admin role required)")]
    [HttpDelete("{id}/remove/{userId}/admin")]
    [ProducesResponseType((int) HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public IActionResult RemoveAdmin([FromRoute] Guid id, [FromRoute] Guid userId)
    {
      _logger.LogInformation("Handling request {requestName} ({paramName1}: {paramValue1} | {paramName2}: {paramValue2})",
          nameof(RemoveAdmin), nameof(id), id, nameof(userId), userId);


      var result = _organizationService.RemoveAdmin(id, userId);

      _logger.LogInformation("Request {requestName} handled", nameof(RemoveAdmin));

      return StatusCode((int) HttpStatusCode.OK, result);
    }
    #endregion Administrative Actions
    #endregion
  }
}
