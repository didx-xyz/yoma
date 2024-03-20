using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
  public interface IMyOpportunityService
  {
    Models.MyOpportunity GetById(Guid id, bool includeChildItems, bool includeComputed, bool ensureOrganizationAuthorization);

    MyOpportunityResponseVerify GetVerificationStatus(Guid opportunityId);

    List<MyOpportunitySearchCriteriaOpportunity> ListMyOpportunityVerificationSearchCriteriaOpportunity(List<Guid>? organizations, List<VerificationStatus>? verificationStatuses, bool ensureOrganizationAuthorization);

    MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter);

    MyOpportunitySearchResults Search(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

    Task PerformActionViewed(Guid opportunityId);

    Task PerformActionSaved(Guid opportunityId);

    bool ActionedSaved(Guid opportunityId);

    Task PerformActionSavedRemove(Guid opportunityId);

    Task PerformActionSendForVerificationManual(Guid opportunityId, MyOpportunityRequestVerify request);

    Task PerformActionSendForVerificationManual(Guid userId, Guid opportunityId, MyOpportunityRequestVerify request, bool overridePending);

    Task PerformActionSendForVerificationManualDelete(Guid opportunityId);

    Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalizeBatch request);

    Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalize request);

    Dictionary<Guid, int>? ListAggregatedOpportunityByViewed(PaginationFilter filter, bool includeExpired);
  }
}
