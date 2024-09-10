using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class StoreAccessControlRuleInfoService : IStoreAccessControlRuleInfoService
  {
    #region Class Variables
    private readonly IStoreAccessControlRuleService _storeAccessControlRuleService;
    private readonly IMarketplaceService _marketplaceService;
    #endregion

    #region Constructor
    public StoreAccessControlRuleInfoService(
      IStoreAccessControlRuleService storeAccessControlRuleService,
      IMarketplaceService marketplaceService)
    {
      _storeAccessControlRuleService = storeAccessControlRuleService;
      _marketplaceService = marketplaceService;
    }
    #endregion

    #region Public Members
    public async Task<StoreAccessControlRuleInfo> GetById(Guid id)
    {
      var result = _storeAccessControlRuleService.GetById(id);
      return await ToInfo(result);
    }

    public List<OrganizationInfo> ListSearchCriteriaOrganizations()
    {
      throw new NotImplementedException();
    }

    public List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId)
    {
      throw new NotImplementedException();
    }

    public async Task<StoreAccessControlRuleSearchResults> Search(StoreAccessControlRuleSearchFilter filter)
    {
      var results = _storeAccessControlRuleService.Search(filter);

      var items = await Task.WhenAll(results.Items.Select(ToInfo));
      return new StoreAccessControlRuleSearchResults
      {
        TotalCount = results.TotalCount,
        Items = items.ToList()
      };
    }

    public async Task<StoreAccessControlRuleInfo> Create(StoreAccessControlRuleRequestCreate request)
    {
      var result = await _storeAccessControlRuleService.Create(request);
      return await ToInfo(result);
    }

    public async Task<StoreAccessControlRuleInfo> Update(StoreAccessControlRuleRequestUpdate request)
    {
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
    private async Task<StoreAccessControlRuleInfo> ToInfo(StoreAccessControlRule item)
    {
      var storeSearchResults = await _marketplaceService.SearchStores(new StoreSearchFilter { CountryCodeAlpha2 = item.StoreCountryCodeAlpha2 });
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

      var storeItemCategorySearchResults = store == null ? null : await _marketplaceService.SearchStoreItemCategories(new Models.StoreItemCategorySearchFilter { StoreId = store.Id });

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
    #endregion
  }
}
