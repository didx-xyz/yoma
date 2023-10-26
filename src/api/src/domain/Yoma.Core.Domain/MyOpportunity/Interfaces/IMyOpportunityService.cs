using Yoma.Core.Domain.Core.Models;
using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
    public interface IMyOpportunityService
    {
        MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter);

        MyOpportunitySearchResults Search(MyOpportunitySearchFilterAdmin filter, bool ensureOrganizationAuthorization);

        Task PerformActionViewed(Guid opportunityId);

        Task PerformActionSaved(Guid opportunityId);

        Task PerformActionSavedRemove(Guid opportunityId);

        Task PerformActionSendForVerificationManual(Guid opportunityId, MyOpportunityRequestVerify request);

        Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalizeBatch request);

        Task FinalizeVerificationManual(MyOpportunityRequestVerifyFinalize request);

        Dictionary<Guid, int>? ListAggregatedOpportunityByViewed(PaginationFilter filter, bool includeExpired);

        List<Models.MyOpportunity> ListPendingSSICredentialIssuance(int batchSize);

        Task<Models.MyOpportunity> UpdateSSICredentialReference(Guid id, string credentialId);
    }
}
