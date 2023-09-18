namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityBackgroundService
    {
        void ProcessExpiration();

        void ProcessExpirationNotifications();

        void ProcessDeletion();
    }
}
