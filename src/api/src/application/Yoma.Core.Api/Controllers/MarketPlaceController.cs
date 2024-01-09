using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/marketplace")]
    [ApiController]
    [Authorize(Policy = Common.Constants.Authorization_Policy)]
    [SwaggerTag("(by default, User role required)")]
    public class MarketplaceController : Controller
    {
        #region Class Variables
        private readonly ILogger<MarketplaceController> _logger;
        private readonly IMarketplaceService _marketplaceService;
        #endregion

        #region Constructor
        public MarketplaceController(
          ILogger<MarketplaceController> logger,
          IMarketplaceService marketplaceService)
        {
            _logger = logger;
            _marketplaceService = marketplaceService;
        }
        #endregion

        #region Public Members
        #region Authenticated User Based Actions
        [SwaggerOperation(Summary = "Return a list of store categories (Authenticated User)")]
        [HttpGet("store/category")]
        [ProducesResponseType(typeof(List<StoreCategory>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}")]
        public async Task<IActionResult> ListStoreCategories()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListStoreCategories));

            var result = await _marketplaceService.ListStoreCategories();

            _logger.LogInformation("Request {requestName} handled", nameof(ListStoreCategories));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for stores based on the supplied filter (Authenticated User)")]
        [HttpPost("store/search")]
        [ProducesResponseType(typeof(StoreSearchResults), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}")]
        public async Task<IActionResult> SearchStores([FromBody] StoreSearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(SearchStores));

            var result = await _marketplaceService.SearchStores(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(SearchStores));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of store item categories (Authenticated User)")]
        [HttpGet("store/{storedId}/category/item")]
        [ProducesResponseType(typeof(List<StoreItemCategory>), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}")]
        public async Task<IActionResult> ListStoreItemCategories()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListStoreCategories));

            var result = await _marketplaceService.ListStoreCategories();

            _logger.LogInformation("Request {requestName} handled", nameof(ListStoreCategories));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for stores items based on the supplied filter (Authenticated User)")]
        [HttpPost("store/item/search")]
        [ProducesResponseType(typeof(StoreItemSearchResults), (int)HttpStatusCode.OK)]
        [Authorize(Roles = $"{Constants.Role_User}")]
        public async Task<IActionResult> SearchStoreItems([FromBody] StoreItemSearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(SearchStoreItems));

            var result = await _marketplaceService.SearchStoreItems(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(SearchStoreItems));

            return StatusCode((int)HttpStatusCode.OK, result);
        }
        #endregion Authenticated User Based Actions
        #endregion
    }
}
