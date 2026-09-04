using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Models.Provider;

namespace Yoma.Core.Domain.Marketplace.Interfaces.Provider
{
  public interface IMarketplaceProviderClient
  {
    List<string> ListSupportedCountryCodesAlpha2(string? countryCodeAlpha2);

    Task<List<StoreCategory>> ListStoreCategories(string? countryCodeAlpha2);

    Task<List<Store>> ListStores(string? countryCodeAlpha2, string? categoryId, int? limit, int? offset);

    Task<List<StoreItemCategory>> ListStoreItemCategories(string storeId, int? limit, int? offset);

    Task<List<StoreItem>> ListStoreItems(string storeId, string itemCategoryId, int? limit, int? offset);

    Task<ReserveItemResponse> ReserveItem(ReserveItemRequest request);

    Task CommitItemReservation(CommitItemReservationRequest request);

    Task ReleaseItemReservation(ReleaseItemReservationRequest request);
  }
}
