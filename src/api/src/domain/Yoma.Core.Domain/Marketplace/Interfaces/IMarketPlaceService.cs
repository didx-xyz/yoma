using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces
{
    public interface IMarketplaceService
    {
        List<Lookups.Models.Country> ListSearchCriteriaCountries();

        Task<List<StoreCategory>> ListStoreCategories(string countryCodeAlpha2);

        Task<StoreSearchResults> SearchStores(StoreSearchFilter filter);

        Task<StoreItemCategorySearchResults> SearchStoreItemCategories(StoreItemCategorySearchFilter filter);

        Task<StoreItemSearchResults> SearchStoreItems(StoreItemSearchFilter filter);
    }
}
