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
    }
}
