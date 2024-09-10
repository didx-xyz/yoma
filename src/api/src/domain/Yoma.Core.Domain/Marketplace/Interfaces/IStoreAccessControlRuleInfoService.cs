using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces
{
  public interface IStoreAccessControlRuleInfoService
  {
    Task<StoreAccessControlRuleInfo> GetById(Guid id);

    List<OrganizationInfo> ListSearchCriteriaOrganizations();

    List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId);

    Task<StoreAccessControlRuleSearchResults> Search(StoreAccessControlRuleSearchFilter filter);

    Task<StoreAccessControlRuleInfo> Create(StoreAccessControlRuleRequestCreate request);

    Task<StoreAccessControlRuleInfo> Update(StoreAccessControlRuleRequestUpdate request);

    Task<StoreAccessControlRuleInfo> UpdateStatus(Guid id, StoreAccessControlRuleStatus status);
  }
}
