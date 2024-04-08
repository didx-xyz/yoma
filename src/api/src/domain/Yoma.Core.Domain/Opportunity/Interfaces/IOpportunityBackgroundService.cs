namespace Yoma.Core.Domain.Opportunity.Interfaces
{
  public interface IOpportunityBackgroundService
  {
    Task ProcessExpiration();

    Task ProcessExpirationNotifications();

    Task ProcessDeletion();
  }
}
