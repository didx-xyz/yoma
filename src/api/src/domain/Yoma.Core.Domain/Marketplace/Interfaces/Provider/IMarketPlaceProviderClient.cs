using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces.Provider
{
  public interface IMarketplaceProviderClient
  {
    List<string> ListSupportedCountryCodesAlpha2(string? countryCodeAlpha2);

    Task<List<StoreCategory>> ListStoreCategories(string? countryCodeAlpha2);

    Task<List<Store>> ListStores(string? countryCodeAlpha2, string? categoryId, int? limit, int? offset);

    Task<List<StoreItemCategory>> ListStoreItemCategories(string storeId, int? limit, int? offset);

    Task<List<StoreItem>> ListStoreItems(string storeId, string itemCategoryId, int? limit, int? offset);

    Task<string> ItemReserve(string walletId, string username, string itemId);

    Task ItemReserveReset(string itemId, string transactionId);

    Task ItemSold(string walletId, string username, string itemId, string transactionId);
  }
}
