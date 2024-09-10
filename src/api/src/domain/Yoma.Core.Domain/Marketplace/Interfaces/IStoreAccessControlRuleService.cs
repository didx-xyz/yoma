using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Interfaces
{
  public interface IStoreAccessControlRuleService
  {
    StoreAccessControlRule GetById(Guid id);

    StoreAccessControlRuleSearchResultsInternal Search(StoreAccessControlRuleSearchFilter filter);

    Task<StoreAccessControlRule> Create(StoreAccessControlRuleRequestCreate request);

    Task<StoreAccessControlRule> Update(StoreAccessControlRuleRequestUpdate request);

    Task<StoreAccessControlRule> UpdateStatus(Guid id, StoreAccessControlRuleStatus status);
  }
}
