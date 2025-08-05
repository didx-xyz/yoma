using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Lookups.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/lookup")]
  [ApiController]
  [AllowAnonymous]
  [SwaggerTag("(Anonymous)")]
  public class LookupController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<UserController> _logger;
    private readonly ICountryService _countryService;
    private readonly IEducationService _educationService;
    private readonly IEngagementTypeService _engagementTypeService;
    private readonly IGenderService _genderService;
    private readonly ILanguageService _languageService;
    private readonly ISkillService _skillService;
    private readonly ITimeIntervalService _timeIntervalService;
    #endregion

    #region Constructor
    public LookupController(
        ILogger<UserController> logger,
        ICountryService countryService,
        IEducationService educationService,
        IEngagementTypeService engagementTypeService,
        IGenderService genderService,
        ILanguageService languageService,
        ISkillService skillService,
        ITimeIntervalService timeIntervalService)
    {
      _logger = logger;
      _countryService = countryService;
      _educationService = educationService;
      _engagementTypeService = engagementTypeService;
      _genderService = genderService;
      _languageService = languageService;
      _skillService = skillService;
      _timeIntervalService = timeIntervalService;
    }
    #endregion

    #region Public Members
    #region Anonymous Actions
    [SwaggerOperation(Summary = "Return a list of countries. Optionally exclude Worldwide")]
    [HttpGet("country")]
    [ProducesResponseType(typeof(List<Country>), (int)HttpStatusCode.OK)]
    public IActionResult ListCountries([FromQuery] bool? excludeWorldwide = null)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListCountries));

      var result = _countryService.List(excludeWorldwide);

      _logger.LogInformation("Request {requestName} handled", nameof(ListCountries));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of educations")]
    [HttpGet("education")]
    [ProducesResponseType(typeof(List<Education>), (int)HttpStatusCode.OK)]
    public IActionResult ListEducations()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListEducations));

      var result = _educationService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListEducations));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of engagement types")]
    [HttpGet("engagement")]
    [ProducesResponseType(typeof(List<EngagementType>), (int)HttpStatusCode.OK)]
    public IActionResult ListEngagementTypes()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListEngagementTypes));

      var result = _engagementTypeService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListEngagementTypes));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of genders")]
    [HttpGet("gender")]
    [ProducesResponseType(typeof(List<Gender>), (int)HttpStatusCode.OK)]
    public IActionResult ListGenders()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListGenders));

      var result = _genderService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListGenders));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of languages")]
    [HttpGet("language")]
    [ProducesResponseType(typeof(List<Language>), (int)HttpStatusCode.OK)]
    public IActionResult ListLanguages()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListLanguages));

      var result = _languageService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListLanguages));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for skills based on the supplied filter")]
    [HttpGet("skill")]
    [ProducesResponseType(typeof(SkillSearchResults), (int)HttpStatusCode.OK)]
    public IActionResult SearchSkills([FromQuery] SkillSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchSkills));

      var result = _skillService.Search(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchSkills));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of time intervals")]
    [HttpGet("timeInterval")]
    [ProducesResponseType(typeof(List<TimeInterval>), (int)HttpStatusCode.OK)]
    public IActionResult ListTimeIntervals()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListTimeIntervals));

      var result = _timeIntervalService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListTimeIntervals));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Anonymous Actions
    #endregion
  }
}
