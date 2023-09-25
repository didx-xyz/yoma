using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.SSI.Interfaces;
using Yoma.Core.Domain.SSI.Interfaces.Lookups;
using Yoma.Core.Domain.SSI.Models;
using Yoma.Core.Domain.SSI.Models.Lookups;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/ssi")]
    [ApiController]
    [Authorize(Policy = Common.Constants.Authorization_Policy)]
    [SwaggerTag("(by default, Admin role required)")]
    public class SSIController : Controller
    {
        #region Class Variables
        private readonly ILogger<SSIController> _logger;
        private readonly ISSISchemaEntityService _ssiSchemaEntityService;
        private readonly ISSISchemaService _ssiSchemaService;
        #endregion

        #region Constructor
        public SSIController(
          ILogger<SSIController> logger,
          ISSISchemaEntityService ssiSchemaEntityService,
          ISSISchemaService ssiSchemaService)
        {
            _logger = logger;
            _ssiSchemaEntityService = ssiSchemaEntityService;
            _ssiSchemaService = ssiSchemaService;
        }
        #endregion

        #region Public Members
        #region Administrative Actions
        [SwaggerOperation(Summary = "Return a list of schema entities (objects) and their associated properties that serve as data sources when creating a schema")]
        [HttpGet("schema/entity")]
        [ProducesResponseType(typeof(List<SSISchemaEntity>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = Constants.Role_Admin)]
        public IActionResult ListSchemaEntities()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListSchemaEntities));

            var result = _ssiSchemaEntityService.List();

            _logger.LogInformation("Request {requestName} handled", nameof(ListSchemaEntities));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of configured schemas. Optionally, only return the latest version of each schema (Admin or Organization Admin roles required)", Description = "Results includes the schema's associated entities (objects) and properties")]
        [HttpGet("schema")]
        [ProducesResponseType(typeof(List<SSISchema>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_Admin}, {Constants.Role_OrganizationAdmin}")]
        public async Task<IActionResult> ListSchemas([FromQuery] bool? latestVersions)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListSchemas));

            var result = await _ssiSchemaService.List(latestVersions);

            _logger.LogInformation("Request {requestName} handled", nameof(ListSchemas));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Create a new schema with the specified entities (objects) and properties", Description = "If a schema with the specified name already exists, a new version will be automatically created")]
        [HttpPost("schema")]
        [ProducesResponseType(typeof(SSISchema), (int)HttpStatusCode.OK)]
        [Authorize(Roles = Constants.Role_Admin)]
        public async Task<IActionResult> CreateSchema([FromBody] SSISchemaRequest request)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(CreateSchema));

            var result = await _ssiSchemaService.Create(request);

            _logger.LogInformation("Request {requestName} handled", nameof(CreateSchema));

            return StatusCode((int)HttpStatusCode.OK, result);
        }
        #endregion Administrative Actions
        #endregion
    }
}
