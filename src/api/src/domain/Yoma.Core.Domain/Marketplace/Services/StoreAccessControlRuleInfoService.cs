using FluentValidation;
using Microsoft.Extensions.Options;
using Yoma.Core.Domain.Core.Extensions;
using Yoma.Core.Domain.Core.Helpers;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.Marketplace.Validators;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class StoreAccessControlRuleInfoService : IStoreAccessControlRuleInfoService
  {
    #region Class Variables
    private readonly AppSettings _appSettings;
    private readonly IDistributedCacheService _distributedCacheService;
    private readonly IStoreAccessControlRuleService _storeAccessControlRuleService;
    private readonly IMarketplaceService _marketplaceService;
    private readonly StoreAccessControlRuleRequestValidatorCreate _storeAccessControlRuleRequestValidatorCreate;
    private readonly StoreAccessControlRuleRequestValidatorUpdate _storeAccessControlRuleRequestValidatorUpdate;
    #endregion

    #region Constructor
    public StoreAccessControlRuleInfoService(IOptions<AppSettings> appSettings,
      IDistributedCacheService distributedCacheService,
      IStoreAccessControlRuleService storeAccessControlRuleService,
      IMarketplaceService marketplaceService,
      StoreAccessControlRuleRequestValidatorCreate storeAccessControlRuleRequestValidatorCreate,
      StoreAccessControlRuleRequestValidatorUpdate storeAccessControlRuleRequestValidatorUpdate)
    {
      _appSettings = appSettings.Value;
      _distributedCacheService = distributedCacheService;
      _storeAccessControlRuleService = storeAccessControlRuleService;
      _marketplaceService = marketplaceService;
      _storeAccessControlRuleRequestValidatorCreate = storeAccessControlRuleRequestValidatorCreate;
      _storeAccessControlRuleRequestValidatorUpdate = storeAccessControlRuleRequestValidatorUpdate;
    }
    #endregion

    #region Public Members
    public async Task<StoreAccessControlRuleInfo> GetById(Guid id)
    {
      var result = _storeAccessControlRuleService.GetById(id, true);
      return await ToInfo(result);
    }

    public async Task<List<StoreInfo>> ListSearchCriteriaStores(Guid? organizationId, bool ensureOrganizationAuthorization)
    {
      var results = _storeAccessControlRuleService.ListSearchCriteriaStores(organizationId, ensureOrganizationAuthorization);

      foreach (var item in results)
      {
        var stores = await StoresCached(item.CountryCodeAlpha2);
        var store = stores.SingleOrDefault(o => o.Id == item.Id);

        item.Name = store?.Name ?? "Unknown";
      }

      results = [.. results.OrderBy(o => o.Name)];

      return results;
    }

    public async Task<StoreAccessControlRuleSearchResultsInfo> Search(StoreAccessControlRuleSearchFilter filter, bool ensureOrganizationAuthorization)
    {
      var results = _storeAccessControlRuleService.Search(filter, ensureOrganizationAuthorization);

      var items = await Task.WhenAll(results.Items.Select(ToInfo)).FlattenAggregateException();
      return new StoreAccessControlRuleSearchResultsInfo
      {
        TotalCount = results.TotalCount,
        Items = [.. items]
      };
    }

    public async Task<StoreAccessControlRulePreviewInfo> CreatePreview(StoreAccessControlRuleRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorCreate.ValidateAndThrowAsync(request);

      await ValidateStoreInfo(request);

      request.RequestValidationHandled = true;
      var result = _storeAccessControlRuleService.CreatePreview(request);

      return new StoreAccessControlRulePreviewInfo
      {
        UserCount = result.UserCount,
        UserCountTotal = result.UserCountTotal,
        RulesRelated = [.. await Task.WhenAll(result.RulesRelated.Select(async item => new StoreAccessControlRulePreviewItemInfo
        {
          UserCount = item.UserCount,
          Rule = await ToInfo(item.Rule)
        })).FlattenAggregateException()]
      };
    }

    public async Task<StoreAccessControlRuleInfo> Create(StoreAccessControlRuleRequestCreate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorCreate.ValidateAndThrowAsync(request);

      await ValidateStoreInfo(request);

      request.RequestValidationHandled = true;
      var result = await _storeAccessControlRuleService.Create(request);

      return await ToInfo(result);
    }

    public async Task<StoreAccessControlRulePreviewInfo> UpdatePreview(StoreAccessControlRuleRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorUpdate.ValidateAndThrowAsync(request);

      await ValidateStoreInfo(request);

      request.RequestValidationHandled = true;
      var result = _storeAccessControlRuleService.UpdatePreview(request);

      return new StoreAccessControlRulePreviewInfo
      {
        UserCount = result.UserCount,
        UserCountTotal = result.UserCountTotal,
        RulesRelated = [.. await Task.WhenAll(result.RulesRelated.Select(async item => new StoreAccessControlRulePreviewItemInfo
        {
          UserCount = item.UserCount,
          Rule = await ToInfo(item.Rule)
        })).FlattenAggregateException()]
      };
    }

    public async Task<StoreAccessControlRuleInfo> Update(StoreAccessControlRuleRequestUpdate request)
    {
      ArgumentNullException.ThrowIfNull(request, nameof(request));

      await _storeAccessControlRuleRequestValidatorUpdate.ValidateAndThrowAsync(request);

      await ValidateStoreInfo(request);

      request.RequestValidationHandled = true;
      var result = await _storeAccessControlRuleService.Update(request);

      return await ToInfo(result);
    }

    public async Task<StoreAccessControlRuleInfo> UpdateStatus(Guid id, StoreAccessControlRuleStatus status)
    {
      var result = await _storeAccessControlRuleService.UpdateStatus(id, status);
      return await ToInfo(result);
    }
    #endregion

    #region Private Members
    private async Task ValidateStoreInfo(StoreAccessControlRuleRequestBase request)
    {
      var storeExists = await StoreExists(request.StoreCountryCodeAlpha2, request.StoreId);
      if (!storeExists)
        throw new ValidationException($"Store does not exist in the specified country ('{request.StoreCountryCodeAlpha2}')");

      if (request.StoreItemCategories != null && request.StoreItemCategories.Count > 0)
        foreach (var category in request.StoreItemCategories)
        {
          var categoryExists = await StoreItemCategoryExists(request.StoreId, category);
          if (!categoryExists)
            throw new ValidationException($"One or more selected store item categories do not exist for the given store");
        }
    }

    private async Task<bool> StoreExists(string countryCodeAlpha2, string storeId)
    {
      var result = await _marketplaceService.SearchStores(new StoreSearchFilter { CountryCodeAlpha2 = countryCodeAlpha2 });
      return result.Items.Any(x => x.Id == storeId);
    }

    private async Task<bool> StoreItemCategoryExists(string storeId, string storeItemCategoryId)
    {
      var result = await _marketplaceService.SearchStoreItemCategories(new StoreItemCategorySearchFilter { StoreId = storeId });
      return result.Items.Any(x => x.Id == storeItemCategoryId);
    }

    private async Task<StoreAccessControlRuleInfo> ToInfo(StoreAccessControlRule item)
    {
      var storeSearchResults = await StoresCached(item.StoreCountryCodeAlpha2);
      var store = storeSearchResults.SingleOrDefault(o => o.Id == item.StoreId);

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

      var storeItemCategories = store == null ? null : await StoreItemCategoriesCached(store.Id);

      result.StoreItemCategories = [.. item.StoreItemCategories.Select(item =>
      {
        var storeItemCategory = storeItemCategories?.SingleOrDefault(x => x.Id == item);

        return new StoreItemCategoryInfo
        {
          Id = item,
          Name = storeItemCategory?.Name ?? "Unknown"
        };
      })];

      return result;
    }

    /// <summary>
    /// Caches the stores for store info resolution. The cache expires every hour based on sliding expiration settings.
    /// </summary>
    private async Task<List<Store>> StoresCached(string countryCodeAlpha2)
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return (await _marketplaceService.SearchStores(new StoreSearchFilter { CountryCodeAlpha2 = countryCodeAlpha2 })).Items;

      var result = await _distributedCacheService.GetOrCreateAsync(
          CacheHelper.GenerateKey<StoreSearchResults>(countryCodeAlpha2),
          async () => (await _marketplaceService.SearchStores(new StoreSearchFilter { CountryCodeAlpha2 = countryCodeAlpha2 })).Items,
          null, // No absolute expiration
          TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours) // Sliding expiration as absolute ensures new stores/categories are picked up
        ) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(StoreSearchResults)}s'");

      return result;
    }

    /// <summary>
    /// Caches the categories for store item category resolution. The cache expires every hour based on sliding expiration settings
    /// </summary>
    private async Task<List<StoreItemCategory>> StoreItemCategoriesCached(string storeId)
    {
      if (!_appSettings.CacheEnabledByCacheItemTypesAsEnum.HasFlag(Core.CacheItemType.Lookups))
        return (await _marketplaceService.SearchStoreItemCategories(new StoreItemCategorySearchFilter { StoreId = storeId, EvaluateStoreAccessControlRules = false })).Items;

      var result = await _distributedCacheService.GetOrCreateAsync(
          CacheHelper.GenerateKey<StoreItemCategorySearchResults>(storeId),
          async () => (await _marketplaceService.SearchStoreItemCategories(new StoreItemCategorySearchFilter
          {
            StoreId = storeId,
            EvaluateStoreAccessControlRules = false
          })).Items,
          null, // No absolute expiration
          TimeSpan.FromHours(_appSettings.CacheSlidingExpirationInHours) // Sliding expiration as absolute ensures new stores/categories are picked up
        ) ?? throw new InvalidOperationException($"Failed to retrieve cached list of '{nameof(StoreItemCategorySearchResults)}s'");

      return result;
    }
    #endregion
  }
}
