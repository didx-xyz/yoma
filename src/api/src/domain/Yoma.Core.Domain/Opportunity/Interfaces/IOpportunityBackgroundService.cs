namespace Yoma.Core.Domain.Opportunity.Interfaces
{
  public interface IOpportunityBackgroundService
  {
    Task ProcessPublishedNotifications();

    Task ProcessExpiration();

    Task ProcessExpirationNotifications();

    Task ProcessDeletion();
  }
}
