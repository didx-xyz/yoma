namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface ILinkMaintenanceService
  {
    Task CancelByUserId(Guid userId);

    Task CancelByProgramId(Guid programId);
  }
}
