using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Reward.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Reward.Repositories.Lookup
{
  public class RewardTransactionStatusRepository : BaseRepository<Entities.Lookups.RewardTransactionStatus, Guid>, IRepository<RewardTransactionStatus>
  {
    #region Constructor
    public RewardTransactionStatusRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<RewardTransactionStatus> Query()
    {
      return _context.RewardTransactionStatus.Select(entity => new RewardTransactionStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<RewardTransactionStatus> Create(RewardTransactionStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<RewardTransactionStatus> Update(RewardTransactionStatus item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(RewardTransactionStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
