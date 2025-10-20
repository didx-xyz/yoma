namespace Yoma.Core.Domain.Referral.Interfaces.Lookups
{
  public interface IBlockReasonService
  {
    Models.Lookups.BlockReason GetById(Guid id);

    Models.Lookups.BlockReason? GetByIdOrNull(Guid id);

    List<Models.Lookups.BlockReason> List();
  }
}
