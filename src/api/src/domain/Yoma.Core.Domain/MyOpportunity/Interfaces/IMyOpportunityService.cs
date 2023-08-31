using Yoma.Core.Domain.MyOpportunity.Models;

namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
    public interface IMyOpportunityService
    {
        MyOpportunitySearchResults Search(MyOpportunitySearchFilter filter);

        Task PerformActionViewed(Guid opportunityId);

        Task PerformActionSaved(Guid opportunityId);

        Task PerformActionSavedRemove(Guid opportunityId);

        Task PerformActionSendForVerification(Guid opportunityId, MyOpportunityVerifyRequest request);

        Task FinalizeVerification(Guid userId, Guid opportunityId, VerificationStatus status);
    }
}
