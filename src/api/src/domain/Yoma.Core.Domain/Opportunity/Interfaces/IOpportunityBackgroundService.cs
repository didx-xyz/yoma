using System.ComponentModel;

namespace Yoma.Core.Domain.Opportunity.Interfaces
{
    public interface IOpportunityBackgroundService
    {
        [DisplayName("{}")]
        Task ProcessExpiration();

        Task ProcessExpirationNotifications();

        Task ProcessDeletion();
    }
}
