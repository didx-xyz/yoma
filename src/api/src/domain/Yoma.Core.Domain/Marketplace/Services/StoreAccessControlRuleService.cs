using System.Net;
using Yoma.Core.Domain.Entity.Models;
using Yoma.Core.Domain.Marketplace.Interfaces;
using Yoma.Core.Domain.Marketplace.Models;

namespace Yoma.Core.Domain.Marketplace.Services
{
  public class StoreAccessControlRuleService : IStoreAccessControlRuleService
  {
    #region Class Variables
    #endregion

    #region Constructor
    #endregion

    #region Public Members
    public StoreAccessControlRuleInfo GetById(Guid id)
    {
      throw new NotImplementedException();
    }

    public List<OrganizationInfo> ListSearchCriteriaOrganizations()
    {
      throw new NotImplementedException();
    }

    public List<StoreInfo> ListSearchCriteriaStores(Guid? organizationId)
    {
      throw new NotImplementedException();
    }

    public StoreAccessControlRuleSearchResults Search(StoreAccessControlRuleSearchFilter filter)
    {
      throw new NotImplementedException();
    }

    public Task<StoreAccessControlRuleInfo> Create(StoreAccessControlRuleRequestCreate request)
    {
      throw new NotImplementedException();
    }

    public Task<StoreAccessControlRuleInfo> Update(StoreAccessControlRuleRequestUpdate request)
    {
      throw new NotImplementedException();
    }

    public Task<StoreAccessControlRuleInfo> UpdateStatus(Guid id, StoreAccessControlRuleStatus status)
    {
      throw new NotImplementedException();
    }
    #endregion

  }
}
