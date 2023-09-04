using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
    public interface IMyOpportunityService
    {
        MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter);

        Task PerformActionViewed(Guid opportunityId);

        Task PerformActionSaved(Guid opportunityId);

        Task PerformActionSavedRemove(Guid opportunityId);

        Task PerformActionSendForVerification(Guid opportunityId, MyOpportunityRequestVerify request);

        Task FinalizeVerification(Guid opportunityId, MyOpportunityRequestVerifyFinalize request);
    }
}
