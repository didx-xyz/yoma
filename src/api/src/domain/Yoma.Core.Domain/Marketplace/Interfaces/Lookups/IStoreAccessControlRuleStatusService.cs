namespace Yoma.Core.Domain.Marketplace.Interfaces.Lookups
{
  public interface IStoreAccessControlRuleStatusService
  {
    Models.Lookups.StoreAccessControlRuleStatus GetByName(string name);

    Models.Lookups.StoreAccessControlRuleStatus? GetByNameOrNull(string name);

    Models.Lookups.StoreAccessControlRuleStatus GetById(Guid id);

    Models.Lookups.StoreAccessControlRuleStatus? GetByIdOrNull(Guid id);

    List<Models.Lookups.StoreAccessControlRuleStatus> List();
  }
}
