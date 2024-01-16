using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces
{
    public interface IMarketplaceService
    {
        Task<List<StoreCategory>> ListStoreCategories();

        Task<StoreSearchResults> SearchStores(StoreSearchFilter filter);

        Task<List<StoreItemCategory>> ListStoreItemCategories(string storeId);

        Task<StoreItemSearchResults> SearchStoreItems(StoreItemSearchFilter filter);
    }
}
