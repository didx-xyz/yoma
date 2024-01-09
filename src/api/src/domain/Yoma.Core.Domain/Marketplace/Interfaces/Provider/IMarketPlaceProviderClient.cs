using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces.Provider
{
    public interface IMarketplaceProviderClient
    {
        Task<List<StoreCategory>> ListStoreCategories(string? CountryCodeAlpha2);

        Task<List<Store>> ListStores(string? countryCodeAlpha2, string? categoryId, int? limit, int? offset);

        Task<List<StoreItemCategory>> ListStoreItemCategories(string storeId);

        Task<List<StoreItem>> ListStoreItems(string storeId, string itemCategoryId, int? limit, int? offset);
    }
}
