using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Reward.Models;
using Yoma.Core.Domain.Reward.Interfaces;

namespace Yoma.Core.Api.Controllers
{
    [Route("api/v3/marketplace")]
    [ApiController]
    [SwaggerTag("(by default, Anonymous)")]
    public class MarketplaceController : Controller
    {
        #region Class Variables
        private readonly ILogger<MarketplaceController> _logger;
        private readonly IMarketplaceService _marketplaceService;
        private readonly IWalletService _rewardWalletService;
        #endregion

        #region Constructor
        public MarketplaceController(
          ILogger<MarketplaceController> logger,
          IMarketplaceService marketplaceService,
          IWalletService rewardWalletService)
        {
            _logger = logger;
            _marketplaceService = marketplaceService;
            _rewardWalletService = rewardWalletService;
        }
        #endregion

        #region Public Members
        #region Anonymous Actions
        [SwaggerOperation(Summary = "Return a list of countries associated with available stores (Anonymous)")]
        [HttpGet("store/search/filter/country")]
        [ProducesResponseType(typeof(List<Domain.Lookups.Models.Country>), (int)HttpStatusCode.OK)]
        [AllowAnonymous]
        public IActionResult ListSearchCriteriaCountries()
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListSearchCriteriaCountries));

            var result = _marketplaceService.ListSearchCriteriaCountries();

            _logger.LogInformation("Request {requestName} handled", nameof(ListSearchCriteriaCountries));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Return a list of store categories (Anonymous)")]
        [HttpGet("store/{countryCodeAlpha2}/category")]
        [ProducesResponseType(typeof(List<StoreCategory>), (int)HttpStatusCode.OK)]
        [AllowAnonymous]
        public async Task<IActionResult> ListStoreCategories([FromRoute] string countryCodeAlpha2)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(ListStoreCategories));

            var result = await _marketplaceService.ListStoreCategories(countryCodeAlpha2);

            _logger.LogInformation("Request {requestName} handled", nameof(ListStoreCategories));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for stores based on the supplied filter (Anonymous)")]
        [HttpPost("store/search")]
        [ProducesResponseType(typeof(StoreSearchResults), (int)HttpStatusCode.OK)]
        [AllowAnonymous]
        public async Task<IActionResult> SearchStores([FromBody] StoreSearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(SearchStores));

            var result = await _marketplaceService.SearchStores(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(SearchStores));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for store item categories based on the supplied filter (Anonymous)")]
        [HttpPost("store/item/category/search")]
        [ProducesResponseType(typeof(StoreItemCategorySearchResults), (int)HttpStatusCode.OK)]
        [AllowAnonymous]
        public async Task<IActionResult> SearchStoreItemCategories([FromBody] StoreItemCategorySearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(SearchStoreItemCategories));

            var result = await _marketplaceService.SearchStoreItemCategories(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(SearchStoreItemCategories));

            return StatusCode((int)HttpStatusCode.OK, result);
        }

        [SwaggerOperation(Summary = "Search for stores items based on the supplied filter (Anonymous)")]
        [HttpPost("store/item/search")]
        [ProducesResponseType(typeof(StoreItemSearchResults), (int)HttpStatusCode.OK)]
        [AllowAnonymous]
        public async Task<IActionResult> SearchStoreItems([FromBody] StoreItemSearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(SearchStoreItems));

            var result = await _marketplaceService.SearchStoreItems(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(SearchStoreItems));

            return StatusCode((int)HttpStatusCode.OK, result);
        }
        #endregion Anonymous Actions

        #region Authenticated User Based Actions
        [SwaggerOperation(Summary = "Search for vouchers based on the supplied filter (Authenticated User)")]
        [HttpPost("voucher/search")]
        [ProducesResponseType(typeof(WalletVoucherSearchResults), (int)HttpStatusCode.OK)]
        [Authorize(Policy = Common.Constants.Authorization_Policy, Roles = $"{Constants.Role_User}")]
        public async Task<IActionResult> SearchVouchers([FromBody] WalletVoucherSearchFilter filter)
        {
            _logger.LogInformation("Handling request {requestName}", nameof(SearchStoreItems));

            var result = await _rewardWalletService.SearchVouchers(filter);

            _logger.LogInformation("Request {requestName} handled", nameof(SearchStoreItems));

            return StatusCode((int)HttpStatusCode.OK, result);
        }
        #endregion Authenticated User Based Actions
        #endregion
    }
}
