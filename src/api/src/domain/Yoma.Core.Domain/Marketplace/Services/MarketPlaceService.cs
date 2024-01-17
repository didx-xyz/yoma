using FluentValidation;
using Microsoft.AspNetCore.Http;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Entity.Interfaces;
using Yoma.Core.Domain.Lookups.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Interfaces.Provider;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Validators;

namespace Yoma.Core.Domain.Marketplace.Services
{
    public class MarketplaceService : IMarketplaceService
    {
        #region Class Variables
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ICountryService _countryService;
        private readonly IUserService _userService;
        private readonly IMarketplaceProviderClient _marketplaceProviderClient;
        private readonly StoreSearchFilterValidator _storeSearchFilterValidator;
        private readonly StoreItemSearchFilterValidator _storeItemSearchFilterValidator;
        #endregion

        #region Constructors
        public MarketplaceService(IHttpContextAccessor httpContextAccessor,
            ICountryService countryService,
            IUserService userService,
            IMarketplaceProviderClientFactory marketplaceProviderClientFactory,
            StoreSearchFilterValidator storeSearchFilterValidator,
            StoreItemSearchFilterValidator storeItemSearchFilterValidator)
        {
            _httpContextAccessor = httpContextAccessor;
            _countryService = countryService;
            _userService = userService;
            _marketplaceProviderClient = marketplaceProviderClientFactory.CreateClient();
            _storeSearchFilterValidator = storeSearchFilterValidator;
            _storeItemSearchFilterValidator = storeItemSearchFilterValidator;
        }
        #endregion

        #region Public Members
        public async Task<List<StoreCategory>> ListStoreCategories()
        {
            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

            var countryOfResidence = user.CountryOfResidenceId.HasValue ? _countryService.GetByIdOrNull(user.CountryOfResidenceId.Value) : null;

            return await _marketplaceProviderClient.ListStoreCategories(countryOfResidence?.CodeAlpha2);
        }

        public async Task<List<StoreItemCategory>> ListStoreItemCategories(string storeId)
        {
            return await _marketplaceProviderClient.ListStoreItemCategories(storeId);
        }

        public async Task<StoreSearchResults> SearchStores(StoreSearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            await _storeSearchFilterValidator.ValidateAndThrowAsync(filter);

            var user = _userService.GetByEmail(HttpContextAccessorHelper.GetUsername(_httpContextAccessor, false), false, false);

            var countryOfResidence = user.CountryOfResidenceId.HasValue ? _countryService.GetByIdOrNull(user.CountryOfResidenceId.Value) : null;

            var offset = default(int?);
            if (filter.PaginationEnabled)
                offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

            var result = new StoreSearchResults
            { Items = await _marketplaceProviderClient.ListStores(countryOfResidence?.CodeAlpha2, filter.CategoryId, filter.PageSize, offset) };

            return result;
        }

        public async Task<StoreItemSearchResults> SearchStoreItems(StoreItemSearchFilter filter)
        {
            if (filter == null)
                throw new ArgumentNullException(nameof(filter));

            await _storeItemSearchFilterValidator.ValidateAndThrowAsync(filter);

            var offset = default(int?);
            if (filter.PaginationEnabled)
                offset = filter.PageNumber == 1 ? 0 : ((filter.PageNumber - 1) * filter.PageSize);

            var result = new StoreItemSearchResults
            { Items = await _marketplaceProviderClient.ListStoreItems(filter.StoreId, filter.ItemCategoryId, filter.PageSize, offset) };

            return result;
        }
        #endregion
    }
}