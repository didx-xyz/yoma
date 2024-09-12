using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Marketplace.Models;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces
{
  public interface IStoreAccessControlRuleService
  {
    StoreAccessControlRule GetById(Guid id, bool includeChildItems);

    StoreAccessControlRule? GetByIdOrNull(Guid id, bool includeChildItems);

    List<OrganizationInfo> ListSearchCriteriaOrganizations();

    List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId);

    StoreAccessControlRuleSearchResultsInternal Search(StoreAccessControlRuleSearchFilter filter);

    Task<StoreAccessControlRule> Create(StoreAccessControlRuleRequestCreate request);

    Task<StoreAccessControlRule> Update(StoreAccessControlRuleRequestUpdate request);

    Task<StoreAccessControlRule> UpdateStatus(Guid id, StoreAccessControlRuleStatus status);

    StoreAccessControlRuleResult EvaluateStoreAccessControlRules(StoreItemCategory storeItemCategory, User? user, List<MyOpportunityInfo>? myOpportunitiesCompleted);
  }
}
