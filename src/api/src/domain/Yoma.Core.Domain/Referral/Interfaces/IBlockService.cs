using Yoma.Core.Domain.Referral.Models;

namespace Yoma.Core.Domain.Referral.Interfaces
{
  public interface IBlockService
  {
    Block? GetByUserIdOrNull(Guid userId);

    Task<Block> Block(BlockRequest request);

    Task Unblock(UnblockRequest request);
  }
}
