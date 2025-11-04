namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IProgramBackgroundService
  {
    Task ProcessProgramHealth();

    Task ProcessExpiration();

    Task ProcessDeletion();
  }
}
