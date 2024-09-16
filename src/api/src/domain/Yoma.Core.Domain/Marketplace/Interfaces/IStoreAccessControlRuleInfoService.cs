using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces
{
  public interface IStoreAccessControlRuleInfoService
  {
    Task<StoreAccessControlRuleInfo> GetById(Guid id);

    Task<List<StoreInfo>> ListSearchCriteriaStores(Guid? organizationId);

    Task<StoreAccessControlRuleSearchResultsInfo> Search(StoreAccessControlRuleSearchFilter filter, bool ensureOrganizationAuthorization);

    Task<StoreAccessControlRulePreviewInfo> CreatePreview(StoreAccessControlRuleRequestCreate request);

    Task<StoreAccessControlRuleInfo> Create(StoreAccessControlRuleRequestCreate request);

    Task<StoreAccessControlRulePreviewInfo> UpdatePreview(StoreAccessControlRuleRequestUpdate request);

    Task<StoreAccessControlRuleInfo> Update(StoreAccessControlRuleRequestUpdate request);

    Task<StoreAccessControlRuleInfo> UpdateStatus(Guid id, StoreAccessControlRuleStatus status);
  }
}
