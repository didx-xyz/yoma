using Yoma.Core.Domain.MyOpportunity.Models.Lookups;

namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
    public interface IMyOpportunityVerificationStatusService
    {
        MyOpportunityVerificationStatus GetByName(string name);

        MyOpportunityVerificationStatus? GetByNameOrNull(string name);

        MyOpportunityVerificationStatus GetById(Guid id);

        MyOpportunityVerificationStatus? GetByIdOrNull(Guid id);

        List<MyOpportunityVerificationStatus> List();
    }
}
