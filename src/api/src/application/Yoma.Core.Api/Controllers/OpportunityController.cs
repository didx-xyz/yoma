using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/opportunity")]
    [ApiController]
    [Authorize(Policy = Common.Constants.Authorization_Policy)]
    [SwaggerTag("(by default, Admin or Organization Admin roles required)")]
    public class OpportunityController : Controller
    {
        #region Class Variables
        private readonly ILogger<OpportunityController> _logger;
        private readonly IOpportunityService _opportunityService;
        private readonly IOpportunityCategoryService _opportunityCategoryService;
        private readonly IOpportunityDifficultyService _opportunityDifficultyService;
        private readonly IOpportunityTypeService _opportunityTypeService;
        private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
        #endregion

        #region Constructor
        public OpportunityController(
            ILogger<OpportunityController> logger,
            IOpportunityService opportunityService,
            IOpportunityCategoryService opportunityCategoryService,
            IOpportunityDifficultyService opportunityDifficultyService,
            IOpportunityTypeService opportunityTypeService,
            IOpportunityVerificationTypeService opportunityVerificationTypeService)
        {
            _logger = logger;
            _opportunityService = opportunityService;
            _opportunityCategoryService = opportunityCategoryService;
            _opportunityDifficultyService = opportunityDifficultyService;
            _opportunityTypeService = opportunityTypeService;
            _opportunityVerificationTypeService = opportunityVerificationTypeService;
        }
        #endregion

        #region Public Members
        #region Anonymous Actions
        [SwaggerOperation(Summary = "Get the specified opportunity by id (Anonymous)")]
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(OpportunityInfo), (int)HttpStatusCode.OK)]
        [AllowAnonymous]
        public IActionResult GetInfoById([FromRoute] Guid id)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(GetInfoById));

            var result = _opportunityService.GetInfoById(id, true);

            _logger.LogInformation("Request {requestName} handled", nameof(GetInfoById));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for opportunities based on the supplied filter (Anonymous)")]
        [HttpPost("search")]
        [ProducesResponseType(typeof(List<OpportunitySearchResultsInfo>), (int)HttpStatusCode.OK)]
        [AllowAnonymous]
        public IActionResult Search([FromBody] OpportunitySearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Search));

            var result = _opportunityService.Search(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(Search));

            return StatusCode((int)HttpStatusCode.OK, result);
        }
        #endregion

        #region Administrative Actions
        [SwaggerOperation(Summary = "Return a list of opportunity categories")]
        [HttpGet("category")]
        [ProducesResponseType(typeof(List<Domain.Opportunity.Models.Lookups.OpportunityCategory>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult ListOpportunityCategories()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityCategories));

            var result = _opportunityCategoryService.List();

            _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityCategories));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of opportunity difficulties")]
        [HttpGet("difficulty")]
        [ProducesResponseType(typeof(List<OpportunityDifficulty>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult ListOpportunityDifficulties()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityDifficulties));

            var result = _opportunityDifficultyService.List();

            _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityDifficulties));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of opportunity types")]
        [HttpGet("type")]
        [ProducesResponseType(typeof(List<OpportunityType>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult ListOpportunityTypes()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityTypes));

            var result = _opportunityTypeService.List();

            _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityTypes));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of opportunity verification types")]
        [HttpGet("verificationType")]
        [ProducesResponseType(typeof(List<Domain.Opportunity.Models.Lookups.OpportunityVerificationType>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult ListOpportunityVerificationTypes()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityVerificationTypes));

            var result = _opportunityVerificationTypeService.List();

            _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityVerificationTypes));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for opportunities based on the supplied filter")]
        [HttpPost("search/admin")]
        [ProducesResponseType(typeof(List<OpportunitySearchResults>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult Search([FromBody] OpportunitySearchFilterAdmin filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Search));

            var result = _opportunityService.Search(filter, true);

            _logger.LogInformation("Request {requestName} handled", nameof(Search));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Get the specified opportunity by id")]
        [HttpGet("{id}/admin")]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public IActionResult GetById([FromRoute] Guid id)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(GetById));

            var result = _opportunityService.GetById(id, true, true);

            _logger.LogInformation("Request {requestName} handled", nameof(GetById));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Create a new opportunity")]
        [HttpPost()]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> Create([FromBody] OpportunityRequestCreate request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Create));

            var result = await _opportunityService.Create(request, true);

            _logger.LogInformation("Request {requestName} handled", nameof(Create));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update the specified opportunity")]
        [HttpPatch()]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> Update([FromBody] OpportunityRequestUpdate request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(Update));

            var result = await _opportunityService.Update(request, true);

            _logger.LogInformation("Request {requestName} handled", nameof(Update));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update opportunity status (Active / Inactive / Deleted)")]
        [HttpPatch("{id}/{status}")]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromRoute] Status status)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

            var result = await _opportunityService.UpdateStatus(id, status, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update category(ies) for the specified opportunity")]
        [HttpPatch("{id}/categories")]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateCategories([FromRoute] Guid id, [Required][FromBody] List<Guid> categoryIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateCategories));

            var result = await _opportunityService.UpdateCategories(id, categoryIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateCategories));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update country(ies) for the specified opportunity")]
        [HttpPatch("{id}/countries")]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateCountries([FromRoute] Guid id, [Required][FromBody] List<Guid> countryIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateCountries));

            var result = await _opportunityService.UpdateCountries(id, countryIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateCountries));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update language(s) for the specified opportunity")]
        [HttpPatch("{id}/languages")]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateLanguages([FromRoute] Guid id, [Required][FromBody] List<Guid> languageIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateLanguages));

            var result = await _opportunityService.UpdateLanguages(id, languageIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateLanguages));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update skill(s) for the specified opportunity")]
        [HttpPatch("{id}/skills")]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateSkills([FromRoute] Guid id, [Required][FromBody] List<Guid>? skillIds)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateSkills));

            var result = await _opportunityService.UpdateSkills(id, skillIds, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateSkills));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Update verification type(s) for the specified opportunity")]
        [HttpPatch("{id}/verificationTypes")]
        [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> UpdateVerificationTypes([FromRoute] Guid id, [Required][FromBody] Dictionary<VerificationType, string?>? verificationTypes)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(UpdateVerificationTypes));

            var result = await _opportunityService.UpdateVerificationTypes(id, verificationTypes, true);

            _logger.LogInformation("Request {requestName} handled", nameof(UpdateVerificationTypes));

            return StatusCode((int)HttpStatusCode.OK, result);
        }
        #endregion Administrative Actions
        #endregion
    }
}
