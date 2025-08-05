using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.SSI;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/ssi")]
  [ApiController]
  [Authorize(Policy = Common.Constants.Authorization_Policy)]
  [SwaggerTag("(by default, Admin role required)")]
  public class SSIController : ControllerBase
  {
    #region Class Variables
    private readonly ILogger<SSIController> _logger;
    private readonly ISSISchemaEntityService _ssiSchemaEntityService;
    private readonly ISSISchemaService _ssiSchemaService;
    private readonly ISSISchemaTypeService _ssiSchemaTypeService;
    private readonly ISSIWalletService _ssiWalletService;
    #endregion

    #region Constructor
    public SSIController(
      ILogger<SSIController> logger,
      ISSISchemaEntityService ssiSchemaEntityService,
      ISSISchemaService ssiSchemaService,
      ISSISchemaTypeService ssiSchemaTypeService,
      ISSIWalletService ssiWalletService)
    {
      _logger = logger;
      _ssiSchemaEntityService = ssiSchemaEntityService;
      _ssiSchemaService = ssiSchemaService;
      _ssiSchemaTypeService = ssiSchemaTypeService;
      _ssiWalletService = ssiWalletService;
    }
    #endregion

    #region Public Members
    #region Administrative Actions
    [SwaggerOperation(Summary = "Return a list of schema types")]
    [HttpGet("schema/types")]
    [ProducesResponseType(typeof(List<SSISchemaType>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public IActionResult ListSchemaTypes()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListSchemaTypes));

      var result = _ssiSchemaTypeService.List();

      _logger.LogInformation("Request {requestName} handled", nameof(ListSchemaTypes));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of schema entities (objects) and their associated properties",
      Description = "Serves as data sources when creating a schema, optionally filtered by schema type")]
    [HttpGet("schema/entity")]
    [ProducesResponseType(typeof(List<SSISchemaEntity>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public IActionResult ListSchemaEntities([FromQuery] SchemaType schemaType)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListSchemaEntities));

      var result = _ssiSchemaEntityService.List(schemaType);

      _logger.LogInformation("Request {requestName} handled", nameof(ListSchemaEntities));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of configured schemas (Admin or Organization Admin roles required)",
      Description = "Results reflect the latest version of each schema, optionally filtered by type, and includes the schema's associated entities (objects) and properties")]
    [HttpGet("schema")]
    [ProducesResponseType(typeof(List<SSISchema>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> ListSchemas([FromQuery] SchemaType? schemaType)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListSchemas));

      var result = await _ssiSchemaService.List(schemaType);

      _logger.LogInformation("Request {requestName} handled", nameof(ListSchemas));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Get the latest version of the configured schema with the specified name (Admin or Organization Admin roles required)", Description = "Results includes the schema's associated entities (objects) and properties")]
    [HttpGet("schema/{name}")]
    [ProducesResponseType(typeof(SSISchema), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
    public async Task<IActionResult> GetShemaByName([FromRoute] string name)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetShemaByName));

      var result = await _ssiSchemaService.GetByFullName(name);

      _logger.LogInformation("Request {requestName} handled", nameof(GetShemaByName));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Create a new schema with the specified entities (objects) and properties")]
    [HttpPost("schema")]
    [ProducesResponseType(typeof(SSISchema), (int)HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public async Task<IActionResult> CreateSchema([FromBody] SSISchemaRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateSchema));

      var result = await _ssiSchemaService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateSchema));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update the schema with the specified entities (objects) and properties", Description = "This operation will create a new version of the schema automatically")]
    [HttpPatch("schema")]
    [ProducesResponseType(typeof(SSISchema), (int)HttpStatusCode.OK)]
    [Authorize(Roles = Constants.Role_Admin)]
    public async Task<IActionResult> UpdateSchema([FromBody] SSISchemaRequestUpdate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateSchema));

      var result = await _ssiSchemaService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateSchema));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Administrative Actions

    #region Authenticated User Based Actions
    [SwaggerOperation(Summary = "Search for credentials in the user's wallet based on the supplied filter (Authenticated User)")]
    [HttpPost("wallet/user/search")]
    [ProducesResponseType(typeof(SSIWalletSearchResults), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> SearchUserWalletCredentials([FromBody] SSIWalletSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchUserWalletCredentials));

      var result = await _ssiWalletService.SearchUserCredentials(filter);

      _logger.LogInformation("Request {requestName} handled", nameof(SearchUserWalletCredentials));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Get a specific credential from the user's wallet by id (Authenticated User)")]
    [HttpPost("wallet/user/{id}")]
    [ProducesResponseType(typeof(SSICredential), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> GetUserWalletCredentialById([FromRoute] string id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetUserWalletCredentialById));

      var result = await _ssiWalletService.GetUserCredentialById(id);

      _logger.LogInformation("Request {requestName} handled", nameof(GetUserWalletCredentialById));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Authenticated User Based Actions
    #endregion
  }
}
