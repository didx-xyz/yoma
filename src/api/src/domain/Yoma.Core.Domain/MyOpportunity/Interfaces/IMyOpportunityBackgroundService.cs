namespace Yoma.Core.Domain.MyOpportunity.Interfaces
{
  public interface IMyOpportunityBackgroundService
  {
    Task ProcessVerificationRejection();

    Task SeedPendingVerifications();
  }
}
