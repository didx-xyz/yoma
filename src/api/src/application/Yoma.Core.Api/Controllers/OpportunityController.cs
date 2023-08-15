using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Opportunity.Interfaces;
using Yoma.Core.Domain.Opportunity.Interfaces.Lookups;
using Yoma.Core.Domain.Opportunity.Models.Lookups;

namespace Yoma.Core.Api.Controllers
{
  [Route("api/v3/opportunity")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy, Roles = $"{Constants.Role_Admin},{Constants.Role_OrganizationAdmin}")]
  [SwaggerTag("(Admin or Organization Admin roles required)")]
  public class OpportunityController : Controller
  {
    #region Class Variables
    private readonly ILogger<OpportunityController> _logger;
    private readonly IOpportunityService _opportunityService;
    private readonly IOpportunityCategoryService _opportunityCategoryService;
    private readonly IOpportunityDifficultyService _opportunityDifficultyService;
    private readonly IOpportunityStatusService _opportunityStatusService;
    private readonly IOpportunityTypeService _opportunityTypeService;
    #endregion

    #region Constructor
    public OpportunityController(
        ILogger<OpportunityController> logger,
        IOpportunityService opportunityService,
        IOpportunityCategoryService opportunityCategoryService,
        IOpportunityDifficultyService opportunityDifficultyService,
        IOpportunityStatusService opportunityStatusService,
        IOpportunityTypeService opportunityTypeService
        )
    {
      _logger = logger;
      _opportunityService = opportunityService;
      _opportunityCategoryService = opportunityCategoryService;
      _opportunityDifficultyService = opportunityDifficultyService;
      _opportunityStatusService = opportunityStatusService;
      _opportunityTypeService = opportunityTypeService;
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Return a list of opportunity categories")]
    [HttpGet("category")]
    [ProducesResponseType(typeof(List<OpportunityCategory>), (int) HttpStatusCode.OK)]
    public IActionResult ListOpportunityCategories()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityCategories));

      var result = _opportunityCategoryService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityCategories));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of opportunity difficulties")]
    [HttpGet("difficulty")]
    [ProducesResponseType(typeof(List<OpportunityDifficulty>), (int) HttpStatusCode.OK)]
    public IActionResult ListOpportunityDifficulties()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityDifficulties));

      var result = _opportunityDifficultyService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityDifficulties));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of opportunity statuses")]
    [HttpGet("status")]
    [ProducesResponseType(typeof(List<OpportunityStatus>), (int) HttpStatusCode.OK)]
    public IActionResult ListOpportunityStatuses()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityStatuses));

      var result = _opportunityStatusService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityStatuses));

      return StatusCode((int) HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of opportunity types")]
    [HttpGet("type")]
    [ProducesResponseType(typeof(List<OpportunityType>), (int) HttpStatusCode.OK)]
    public IActionResult ListOpportunityTypes()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListOpportunityTypes));

      var result = _opportunityTypeService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListOpportunityTypes));

      return StatusCode((int) HttpStatusCode.OK, result);
    }
    #endregion Administrative Actions
    #endregion
  }
}
