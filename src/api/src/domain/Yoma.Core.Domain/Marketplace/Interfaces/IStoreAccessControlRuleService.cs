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

    List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId, bool ensureOrganizationAuthorization);

    StoreAccessControlRuleSearchResults Search(StoreAccessControlRuleSearchFilter filter, bool ensureOrganizationAuthorization);

    StoreAccessControlRulePreview CreatePreview(StoreAccessControlRuleRequestCreate request);

    Task<StoreAccessControlRule> Create(StoreAccessControlRuleRequestCreate request);

    StoreAccessControlRulePreview UpdatePreview(StoreAccessControlRuleRequestUpdate request);

    Task<StoreAccessControlRule> Update(StoreAccessControlRuleRequestUpdate request);

    Task<StoreAccessControlRule> UpdateStatus(Guid id, StoreAccessControlRuleStatus status);

    StoreAccessControlRuleEvaluationResult EvaluateStoreAccessControlRules(StoreItemCategory storeItemCategory, User? user, List<MyOpportunityInfo>? myOpportunitiesCompleted);
  }
}
