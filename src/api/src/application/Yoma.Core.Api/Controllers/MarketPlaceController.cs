using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Net;
using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Marketplace;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Opportunity.Models;
using Yoma.Core.Domain.Reward.Interfaces;
using Yoma.Core.Domain.Reward.Models;

namespace Yoma.Core.Api.Controllers
{
  [Route($"api/{Common.Constants.Api_Version}/marketplace")]
  [ApiController]
  [SwaggerTag("(by default, Anonymous)")]
  public class MarketplaceController : Controller
  {
    #region Class Variables
    private readonly ILogger<MarketplaceController> _logger;
    private readonly IMarketplaceService _marketplaceService;
    private readonly IWalletService _rewardWalletService;
    private readonly IStoreAccessControlRuleService _storeAccessControlRuleService;
    #endregion

    #region Constructor
    public MarketplaceController(
      ILogger<MarketplaceController> logger,
      IMarketplaceService marketplaceService,
      IWalletService rewardWalletService,
      IStoreAccessControlRuleService storeAccessControlRuleService)
    {
      _logger = logger;
      _marketplaceService = marketplaceService;
      _rewardWalletService = rewardWalletService;
      _storeAccessControlRuleService = storeAccessControlRuleService;
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

    [SwaggerOperation(Summary = "Buy the next available item in the specified store and item category (Authenticated User)")]
    [HttpPost("store/{storeId}/item/category/{itemCategoryId}/buy")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [Authorize(Policy = Common.Constants.Authorization_Policy, Roles = $"{Constants.Role_User}")]
    public async Task<IActionResult> BuyItem([FromRoute] string storeId, [FromRoute] string itemCategoryId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(BuyItem));

      await _marketplaceService.BuyItem(storeId, itemCategoryId);

      _logger.LogInformation("Request {requestName} handled", nameof(BuyItem));

      return StatusCode((int)HttpStatusCode.OK);
    }
    #endregion Authenticated User Based Actions

    #region Administrative Actions
    [SwaggerOperation(Summary = "Return a list of organizations associated with store access control rules (Admin role required)")]
    [HttpGet("store/rule/search/filter/organizations")]
    [ProducesResponseType(typeof(List<Domain.Entity.Models.OrganizationInfo>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public IActionResult ListSearchCriteriaOrganizations()
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListSearchCriteriaOrganizations));

      var result = _storeAccessControlRuleService.ListSearchCriteriaOrganizations();

      _logger.LogInformation("Request {requestName} handled", nameof(ListSearchCriteriaOrganizations));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Return a list of stores associated with store access control rules, optionally filter by organization (Admin role required)")]
    [HttpGet("store/rule/search/filter/stores")]
    [ProducesResponseType(typeof(List<StoreInfo>), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public IActionResult ListSearchCriteriaStores([FromQuery] Guid? organizationId)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(ListSearchCriteriaStores));

      var result = _storeAccessControlRuleService.ListSearchCriteriaStores(organizationId);

      _logger.LogInformation("Request {requestName} handled", nameof(ListSearchCriteriaStores));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Get the store access control rule by id (Admin role required)")]
    [HttpGet("store/rule/{id}")]
    [ProducesResponseType(typeof(StoreAccessControlRuleInfo), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public IActionResult GetStoreAccessControlRuleById([FromRoute] Guid id)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(GetStoreAccessControlRuleById));

      var result = _storeAccessControlRuleService.GetById(id);

      _logger.LogInformation("Request {requestName} handled", nameof(GetStoreAccessControlRuleById));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Search for store access control rules based on the supplied filter (Admin role required)")]
    [HttpPost("store/rule/search")]
    [ProducesResponseType(typeof(StoreAccessControlRuleSearchResults), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public IActionResult SearchStoreAccessControlRule([FromBody] StoreAccessControlRuleSearchFilter filter)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(SearchStoreAccessControlRule));

      var result = _storeAccessControlRuleService.Search(filter);
      _logger.LogInformation("Request {requestName} handled", nameof(SearchStoreAccessControlRule));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Create a store access control rule (Admin role required)")]
    [HttpPost("store/rule")]
    [ProducesResponseType(typeof(StoreAccessControlRuleInfo), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<IActionResult> CreateStoreAccessControlRule([FromBody] StoreAccessControlRuleRequestCreate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(CreateStoreAccessControlRule));

      var result = await _storeAccessControlRuleService.Create(request);

      _logger.LogInformation("Request {requestName} handled", nameof(CreateStoreAccessControlRule));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update the specified store access control rule (Admin role required)")]
    [HttpPatch("store/rule")]
    [ProducesResponseType(typeof(StoreAccessControlRuleInfo), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<IActionResult> UpdateStoreAccessControlRule([FromBody] StoreAccessControlRuleRequestUpdate request)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateStoreAccessControlRule));

      var result = await _storeAccessControlRuleService.Update(request);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateStoreAccessControlRule));

      return StatusCode((int)HttpStatusCode.OK, result);
    }

    [SwaggerOperation(Summary = "Update the specified store access control rule status (Admin role required)")]
    [HttpPatch("store/rule/{id}/{status}")]
    [ProducesResponseType(typeof(StoreAccessControlRuleInfo), (int)HttpStatusCode.OK)]
    [Authorize(Roles = $"{Constants.Role_Admin}")]
    public async Task<IActionResult> UpdateStatusStoreAccessControlRule([FromRoute] Guid id, [FromRoute] StoreAccessControlRuleStatus status)
    {
      _logger.LogInformation("Handling request {requestName}", nameof(UpdateStatusStoreAccessControlRule));

      var result = await _storeAccessControlRuleService.UpdateStatus(id, status);

      _logger.LogInformation("Request {requestName} handled", nameof(UpdateStatusStoreAccessControlRule));

      return StatusCode((int)HttpStatusCode.OK, result);
    }
    #endregion Administrative Actions
    #endregion
  }
}
