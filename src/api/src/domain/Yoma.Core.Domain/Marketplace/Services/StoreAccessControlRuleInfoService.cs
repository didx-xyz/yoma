using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class StoreAccessControlRuleInfoService : IStoreAccessControlRuleInfoService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IMemoryCache _memoryCache;
    private readonly IStoreAccessControlRuleService _storeAccessControlRuleService;
    private readonly IMarketplaceService _marketplaceService;
    #endregion

    #region Constructor
    public StoreAccessControlRuleInfoService(IOptions<AppSettings> appSettings,
      IMemoryCache memoryCache,
      IStoreAccessControlRuleService storeAccessControlRuleService,
      IMarketplaceService marketplaceService)
    {
      _appSettings = appSettings.Value;
      _memoryCache = memoryCache;
      _storeAccessControlRuleService = storeAccessControlRuleService;
      _marketplaceService = marketplaceService;
    }
    #endregion

    #region Public Members
    public async Task<StoreAccessControlRuleInfo> GetById(Guid id)
    {
      var result = _storeAccessControlRuleService.GetById(id, true);
      return await ToInfo(result);
    }

    public async Task<List<StoreInfo>> ListSearchCriteriaStores(Guid? organizationId)
    {
      var results = _storeAccessControlRuleService.ListSearchCriteriaStores(organizationId);

      foreach (var item in results)
      {
        var storeSearchResults = await StoreSearchResultCached(item.CountryCodeAlpha2);
        var store = storeSearchResults.Items.SingleOrDefault(o => o.Id == item.Id);

        item.Name = store?.Name ?? "Unknown";
      }

      results = [.. results.OrderBy(o => o.Name)];

      return results;
    }

    public async Task<StoreAccessControlRuleSearchResults> Search(StoreAccessControlRuleSearchFilter filter)
    {
      var results = _storeAccessControlRuleService.Search(filter);

      var items = await Task.WhenAll(results.Items.Select(ToInfo));
      return new StoreAccessControlRuleSearchResults
      {
        TotalCount = results.TotalCount,
        Items = [.. items]
      };
    }

    public async Task<StoreAccessControlRuleInfo> Create(StoreAccessControlRuleRequestCreate request)
    {
      var result = await _storeAccessControlRuleService.Create(request);

      _memoryCache.Remove(CacheHelper.GenerateKey<StoreSearchResults>(result.StoreCountryCodeAlpha2));
      _memoryCache.Remove(CacheHelper.GenerateKey<StoreItemCategorySearchResults>(result.StoreId));

      return await ToInfo(result);
    }

    public async Task<StoreAccessControlRuleInfo> Update(StoreAccessControlRuleRequestUpdate request)
    {
      var result = await _storeAccessControlRuleService.Update(request);

      _memoryCache.Remove(CacheHelper.GenerateKey<StoreSearchResults>(result.StoreCountryCodeAlpha2));
      _memoryCache.Remove(CacheHelper.GenerateKey<StoreItemCategorySearchResults>(result.StoreId));

      return await ToInfo(result);
    }

    public async Task<StoreAccessControlRuleInfo> UpdateStatus(Guid id, StoreAccessControlRuleStatus status)
    {
      var result = await _storeAccessControlRuleService.UpdateStatus(id, status);
      return await ToInfo(result);
    }
    #endregion

    #region Private Members
    private async Task<StoreAccessControlRuleInfo> ToInfo(StoreAccessControlRule item)
    {
      var storeSearchResults = await StoreSearchResultCached(item.StoreCountryCodeAlpha2);
      var store = storeSearchResults.Items.SingleOrDefault(o => o.Id == item.StoreId);

      var result = new StoreAccessControlRuleInfo
      {
        Id = item.Id,
        Name = item.Name,
        Description = item.Description,
        OrganizationId = item.OrganizationId,
        OrganizationName = item.OrganizationName,
        Store = new StoreInfo
        {
          Id = item.StoreId,
          Name = store?.Name ?? "Unknown",
          CountryId = item.StoreCountryId,
          CountryName = item.StoreCountryName,
          CountryCodeAlpha2 = item.StoreCountryCodeAlpha2,
        },
        AgeFrom = item.AgeFrom,
        AgeTo = item.AgeTo,
        GenderId = item.GenderId,
        Gender = item.Gender,
        OpportunityOption = item.OpportunityOption,
        StatusId = item.StatusId,
        Status = item.Status,
        DateCreated = item.DateCreated,
        DateModified = item.DateModified,
        Opportunities = item.Opportunities
      };

      if (item.StoreItemCategories == null) return result;

      var storeItemCategorySearchResults = store == null ? null : await StoreItemCategorySearchResultCached(store.Id);

      result.StoreItemCategories = item.StoreItemCategories.Select(item =>
      {
        var storeItemCategory = storeItemCategorySearchResults?.Items.SingleOrDefault(x => x.Id == item);

        return new StoreItemCategoryInfo
        {
          Id = item,
          Name = storeItemCategory?.Name ?? "Unknown"
        };
      }).ToList();

      return result;
    }

    /// <summary>
    /// Caches the store search results for store info resolution. The cache expires based on the cache settings or when a rule is created or updated. The cache applies to existing rules.
    /// When a rule is created or updated, all stores become selectable, so expiring the store info cache is necessary to reflect the latest changes.
    /// </summary>
    private async Task<StoreSearchResults> StoreSearchResultCached(string countryCodeAlpha2)
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return await _marketplaceService.SearchStores(new StoreSearchFilter { CountryCodeAlpha2 = countryCodeAlpha2 });

      var result = await _memoryCache.GetOrCreateAsync(CacheHelper.GenerateKey<StoreSearchResults>(countryCodeAlpha2), async entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return await _marketplaceService.SearchStores(new StoreSearchFilter { CountryCodeAlpha2 = countryCodeAlpha2 });
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(StoreSearchResults)}s'");

      return result;
    }

    /// <summary>
    /// Caches the store item category search results for store item category resolution. The cache expires based on the cache settings or when a rule is created or updated. The cache applies to existing rules.
    /// When a rule is created or updated, all store item categories become selectable, so expiring the store item category cache is necessary to reflect the latest changes.
    /// </summary>
    private async Task<StoreItemCategorySearchResults> StoreItemCategorySearchResultCached(string storeId)
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return await _marketplaceService.SearchStoreItemCategories(new StoreItemCategorySearchFilter { StoreId = storeId });

      var result = await _memoryCache.GetOrCreateAsync(CacheHelper.GenerateKey<StoreItemCategorySearchResults>(storeId), async entry =>
      {
        entry.SlidingExpiration = TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours);
        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(_appSettings.CacheAbsoluteExpirationRelativeToNowInDays);
        return await _marketplaceService.SearchStoreItemCategories(new StoreItemCategorySearchFilter { StoreId = storeId });
      }) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(StoreItemCategorySearchResults)}s'");

      return result;
    }
    #endregion
  }
}
