namespace Yoma.Core.Domain.SSI.Interfaces
{
    public interface ISSICredentialService
    {
        List<MyOpportunity.Models.MyOpportunity> ListPendingIssuanceMyOpportunity(int batchSize);

        Task Issue(MyOpportunity.Models.MyOpportunity item);
    }
}
