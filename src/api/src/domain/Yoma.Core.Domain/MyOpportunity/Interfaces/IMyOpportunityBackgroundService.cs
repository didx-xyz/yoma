namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
    public interface IMyOpportunityBackgroundService
    {
        void ProcessVerificationRejection();
        void SeedPendingVerifications();
    }
}
