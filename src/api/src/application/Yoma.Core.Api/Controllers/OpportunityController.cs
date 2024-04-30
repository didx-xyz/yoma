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
  [Route($"api/{Common.Constants.Api_Version}/opportunity")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin or Organization Admin roles required)")]
  public class OpportunityController : Controller
  {
    #region Class Variables
    private readonly ILogger<OpportunityController> _logger;
    private readonly IOpportunityService _opportunityService;
    private readonly IOpportunityInfoService _opportunityInfoService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly IOpportunityTypeService _opportunityTypeService;
    private readonly IOpportunityVerificationTypeService _opportunityVerificationTypeService;
    #endregion

    #region Constructor
    public OpportunityController(
        ILogger<OpportunityController> logger,
        IOpportunityService opportunityService,
        IOpportunityInfoService opportunityInfoService,
        IOpportunityCategoryService opportunityCategoryService,
        IOpportunityDifficultyService opportunityDifficultyService,
        IOpportunityTypeService opportunityTypeService,
        IOpportunityVerificationTypeService opportunityVerificationTypeService)
    {
      _logger = logger;
      _opportunityService = opportunityService;
      _opportunityInfoService = opportunityInfoService;
      _opportunityCategoryService = opportunityCategoryService;
      _opportunityDifficultyService = opportunityDifficultyService;
      _opportunityTypeService = opportunityTypeService;
      _opportunityVerificationTypeService = opportunityVerificationTypeService;
    }
    #endregion

    #region Public Members
    #region Anonymous Actions
    [SwaggerOperation(Summary = "Get the published or expired opportunity info by id (Anonymous)")]
    [HttpGet("{id}/info")]
    [ProducesResponseType(typeof(OpportunityInfo), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [AllowAnonymous]
    public IActionResult GetPublishedOrExpiredById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetInfoById));

      var result = _opportunityInfoService.GetPublishedOrExpiredById(id);

      _logger.LogInformation("Request {requestName} handled", nameof(GetInfoById));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Get the published or expired opportunity by instant-very link id (Anonymous)")]
    [HttpGet("info/link/{linkId}")]
    [ProducesResponseType(typeof(OpportunityInfo), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [AllowAnonymous]
    public IActionResult GetPublishedOrExpiredByLinkInstantVerify([FromRoute] Guid linkId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetPublishedOrExpiredByLinkInstantVerify));

      var result = _opportunityInfoService.GetPublishedOrExpiredByLinkInstantVerify(linkId);

      _logger.LogInformation("Request {requestName} handled", nameof(GetPublishedOrExpiredByLinkInstantVerify));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for published opportunities based on the supplied filter (Anonymous)",
        Description = "Results are always associated with an active organization. By default published opportunities are included, thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable")]
    [HttpPost("search")]
    [ProducesResponseType(typeof(OpportunitySearchResultsInfo), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult Search([FromBody] OpportunitySearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _opportunityInfoService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of opportunity types (Anonymous)")]
    [HttpGet("type")]
    [ProducesResponseType(typeof(List<Domain.Opportunity.Models.Lookups.OpportunityType>), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult ListOpportunityTypes()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityTypes));

      var result = _opportunityTypeService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityTypes));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of categories associated with published opportunities (Anonymous)",
        Description = "Results are always associated with an active organization. By default published opportunities are included, thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable")]
    [HttpGet("search/filter/category")]
    [ProducesResponseType(typeof(List<Domain.Opportunity.Models.Lookups.OpportunityCategory>), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult ListOpportunitySearchCriteriaCategories([FromQuery] List<PublishedState>? publishedStates)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaCategories));

      var result = _opportunityService.ListOpportunitySearchCriteriaCategories(publishedStates);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaCategories));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of countries associated with published opportunities (Anonymous)",
        Description = "Results are always associated with an active organization. By default published opportunities are included, thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable")]
    [HttpGet("search/filter/country")]
    [ProducesResponseType(typeof(List<Domain.Lookups.Models.Country>), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult ListOpportunitySearchCriteriaCountries([FromQuery] List<PublishedState>? publishedStates)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaCountries));

      var result = _opportunityService.ListOpportunitySearchCriteriaCountries(publishedStates);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaCountries));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of languages associated with published opportunities (Anonymous)",
        Description = "Results are always associated with an active organization. By default published opportunities are included, thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable")]
    [HttpGet("search/filter/language")]
    [ProducesResponseType(typeof(List<Domain.Lookups.Models.Language>), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult ListOpportunitySearchCriteriaLanguages([FromQuery] List<PublishedState>? publishedStates)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaLanguages));

      var result = _opportunityService.ListOpportunitySearchCriteriaLanguages(publishedStates);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaLanguages));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of active organizations associated with published opportunities (Anonymous)",
        Description = "Results are always associated with an active organization. By default published opportunities are included, thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable")]
    [HttpGet("search/filter/organization")]
    [ProducesResponseType(typeof(List<Domain.Entity.Models.OrganizationInfo>), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult ListOpportunitySearchCriteriaOrganizations([FromQuery] List<PublishedState>? publishedStates)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaOrganizations));

      var result = _opportunityService.ListOpportunitySearchCriteriaOrganizations(publishedStates);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaOrganizations));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of commitment intervals associated with published opportunities (Anonymous)",
        Description = "Results are always associated with an active organization. By default published opportunities are included, thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable")]
    [HttpGet("search/filter/commitmentInterval")]
    [ProducesResponseType(typeof(List<OpportunitySearchCriteriaCommitmentInterval>), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult ListOpportunitySearchCriteriaCommitmentInterval([FromQuery] List<PublishedState>? publishedStates)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaCommitmentInterval));

      var result = _opportunityService.ListOpportunitySearchCriteriaCommitmentInterval(publishedStates);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaCommitmentInterval));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Retrieve a list of Zlto reward ranges associated with published opportunities (Anonymous)",
        Description = "Results are always associated with an active organization. By default published opportunities are included, thus active opportunities, irrespective of whether they started (includes both NotStarted and Active states). This default behavior is overridable")]
    [HttpGet("search/filter/zltoReward")]
    [ProducesResponseType(typeof(List<OpportunitySearchCriteriaZltoReward>), (int)HttpStatusCode.OK)]
    [AllowAnonymous]
    public IActionResult ListOpportunitySearchCriteriaZltoReward([FromQuery] List<PublishedState>? publishedStates)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaZltoReward));

      var result = _opportunityService.ListOpportunitySearchCriteriaZltoReward(publishedStates);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaZltoReward));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Get the opportunity info by id (Authenticated User)")]
    [HttpGet("{id}/auth/info")]
    [ProducesResponseType(typeof(OpportunityInfo), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public IActionResult GetInfoById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetInfoById));

      var result = _opportunityInfoService.GetById(id, false);

      _logger.LogInformation("Request {requestName} handled", nameof(GetInfoById));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Authenticated User Based Actions

    #region Administrative Actions
    [SwaggerOperation(Summary = "Return a list of categories associated with opportunities, optionally filter by organization")]
    [HttpGet("search/filter/category/admin")]
    [ProducesResponseType(typeof(List<Domain.Opportunity.Models.Lookups.OpportunityCategory>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult ListOpportunitySearchCriteriaCategoriesAdmin([FromQuery] Guid? organizationId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaCategoriesAdmin));

      var result = _opportunityService.ListOpportunitySearchCriteriaCategoriesAdmin(organizationId, true);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaCategoriesAdmin));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of countries associated with opportunities, optionally filter by organization")]
    [HttpGet("search/filter/country/admin")]
    [ProducesResponseType(typeof(List<Domain.Lookups.Models.Country>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult ListOpportunitySearchCriteriaCountriesAdmin([FromQuery] Guid? organizationId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaCountriesAdmin));

      var result = _opportunityService.ListOpportunitySearchCriteriaCountriesAdmin(organizationId, true);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaCountriesAdmin));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of languages associated with opportunities, optionally filter by organization")]
    [HttpGet("search/filter/language/admin")]
    [ProducesResponseType(typeof(List<Domain.Lookups.Models.Language>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult ListOpportunitySearchCriteriaLanguagesAdmin([FromQuery] Guid? organizationId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaLanguagesAdmin));

      var result = _opportunityService.ListOpportunitySearchCriteriaLanguagesAdmin(organizationId, true);

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaLanguagesAdmin));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of active organizations associated with opportunities")]
    [HttpGet("search/filter/organization/admin")]
    [ProducesResponseType(typeof(List<Domain.Entity.Models.OrganizationInfo>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public IActionResult ListOpportunitySearchCriteriaOrganizationsAdmin()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunitySearchCriteriaOrganizationsAdmin));

      var result = _opportunityService.ListOpportunitySearchCriteriaOrganizationsAdmin();

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunitySearchCriteriaOrganizationsAdmin));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for opportunities based on the supplied filter, returning a lightweight result set/list for search filter input")]
    [HttpPost("search/filter/opportunity")]
    [ProducesResponseType(typeof(OpportunitySearchResultsCriteria), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult SearchCriteriaOpportunities([FromBody] OpportunitySearchFilterCriteria filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchCriteriaOpportunities));

      var result = _opportunityService.SearchCriteriaOpportunities(filter, true);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchCriteriaOpportunities));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

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
    [ProducesResponseType(typeof(OpportunitySearchResultsInfo), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult Search([FromBody] OpportunitySearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(Search));

      var result = _opportunityInfoService.Search(filter, true);

      _logger.LogInformation("Request {requestName} handled", nameof(Search));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Get the opportunity by id")]
    [HttpGet("{id}/admin")]
    [ProducesResponseType(typeof(Opportunity), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult GetById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetById));

      var result = _opportunityService.GetById(id, true, true, true);

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
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
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
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromRoute] Status status)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatus));

      var result = await _opportunityService.UpdateStatus(id, status, true);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatus));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Assign category(ies) to the specified opportunity")]
    [HttpPatch("{id}/assign/categories")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> AssignCategories([FromRoute] Guid id, [Required][FromBody] List<Guid> categoryIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(AssignCategories));

      await _opportunityService.AssignCategories(id, categoryIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(AssignCategories));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Remove category(ies) from the specified opportunity")]
    [HttpPatch("{id}/remove/categories")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> RemoveCategories([FromRoute] Guid id, [Required][FromBody] List<Guid> categoryIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(RemoveCategories));

      await _opportunityService.RemoveCategories(id, categoryIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(RemoveCategories));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Assign country(ies) to the specified opportunity")]
    [HttpPatch("{id}/assign/countries")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> AssignCountries([FromRoute] Guid id, [Required][FromBody] List<Guid> countryIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(AssignCountries));

      await _opportunityService.AssignCountries(id, countryIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(AssignCountries));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Remove country(ies) from the specified opportunity")]
    [HttpPatch("{id}/remove/countries")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> RemoveCountries([FromRoute] Guid id, [Required][FromBody] List<Guid> countryIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(RemoveCountries));

      await _opportunityService.RemoveCountries(id, countryIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(RemoveCountries));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Assign language(s) to the specified opportunity")]
    [HttpPatch("{id}/assign/languages")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> AssignLanguages([FromRoute] Guid id, [Required][FromBody] List<Guid> languageIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(AssignLanguages));

      await _opportunityService.AssignLanguages(id, languageIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(AssignLanguages));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Remove language(s) from the specified opportunity")]
    [HttpPatch("{id}/remove/languages")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> RemoveLanguages([FromRoute] Guid id, [Required][FromBody] List<Guid> languageIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(RemoveLanguages));

      await _opportunityService.RemoveLanguages(id, languageIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(RemoveLanguages));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Assign skill(s) to the specified opportunity")]
    [HttpPatch("{id}/assign/skills")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> AssignSkills([FromRoute] Guid id, [Required][FromBody] List<Guid> skillIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(AssignSkills));

      await _opportunityService.AssignSkills(id, skillIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(AssignSkills));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Remove skill(s) from the specified opportunity")]
    [HttpPatch("{id}/remove/skills")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> RemoveSkills([FromRoute] Guid id, [Required][FromBody] List<Guid> skillIds)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(RemoveSkills));

      await _opportunityService.RemoveSkills(id, skillIds, true);

      _logger.LogInformation("Request {requestName} handled", nameof(RemoveSkills));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Assign verification types(s) to the specified opportunity")]
    [HttpPatch("{id}/assign/verificationTypes")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> AssignVerificationTypes([FromRoute] Guid id, [Required][FromBody] List<OpportunityRequestVerificationType> verificationTypes)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(AssignVerificationTypes));

      await _opportunityService.AssignVerificationTypes(id, verificationTypes, true);

      _logger.LogInformation("Request {requestName} handled", nameof(AssignVerificationTypes));

      return StatusCode((int)HttpStatusCode.OK);
    }

    [SwaggerOperation(Summary = "Remove verification type(s) from the specified opportunity")]
    [HttpPatch("{id}/remove/verificationTypes")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> RemoveVerificationTypes([FromRoute] Guid id, [Required][FromBody] List<VerificationType> verificationTypes)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(RemoveVerificationTypes));

      await _opportunityService.RemoveVerificationTypes(id, verificationTypes, true);

      _logger.LogInformation("Request {requestName} handled", nameof(RemoveVerificationTypes));

      return StatusCode((int)HttpStatusCode.OK);
    }
    #endregion Administrative Actions

    [SwaggerOperation(Summary = "Search for opportunities based on the supplied filter, and export the results to a CSV file")]
    [HttpPost("search/csv")]
    [ProducesResponseType(typeof(FileStreamResult), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public IActionResult ExportToCsvOpportunitySearch([FromBody] OpportunitySearchFilterAdmin filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ExportToCsvOpportunitySearch));

      var (fileName, bytes) = _opportunityInfoService.ExportToCSVOpportunitySearch(filter, true);
      _logger.LogInformation("Request {requestName} handled", nameof(ExportToCsvOpportunitySearch));

      return File(bytes, "text/csv", fileName);
    }
    #endregion
  }
}
