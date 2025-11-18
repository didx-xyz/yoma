using Yoma.Core.Domain.Core;
using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Referral.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;
using Yoma.Core.Infrastructure.Shared.Extensions;

namespace Yoma.Core.Infrastructure.Database.Referral.Repositories.Lookups
{
  public class BlockReasonRepository : BaseRepository<Entities.Lookups.BlockReason, Guid>, IRepository<BlockReason>
  {
    #region Constructor
    public BlockReasonRepository(ApplicationDbContext context) : base(context) { }
    #endregion

    #region Public Members
    public IQueryable<BlockReason> Query(LockMode lockMode)
    {
      return Query().WithLock(lockMode);
    }

    public IQueryable<BlockReason> Query()
    {
      return _context.ReferralBlockReason.Select(entity => new BlockReason
      {
        Id = entity.Id,
        Name = entity.Name,
        Description = entity.Description
      });
    }

    public Task<BlockReason> Create(BlockReason item)
    {
      throw new NotImplementedException();
    }

    public Task<BlockReason> Update(BlockReason item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(BlockReason item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
