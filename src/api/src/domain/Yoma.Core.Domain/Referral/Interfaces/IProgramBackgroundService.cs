namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IProgramBackgroundService
  {
    Task ProcessExpiration();

    Task ProcessDeletion();
  }
}
