using Yoma.Core.Domain.Core.Interfaces;
using Yoma.Core.Domain.Reward.Models.Lookups;
using Yoma.Core.Infrastructure.Database.Context;
using Yoma.Core.Infrastructure.Database.Core.Repositories;

namespace Yoma.Core.Infrastructure.Database.Reward.Repositories.Lookup
{
  public class WalletCreationStatusRepository : BaseRepository<Entities.Lookups.WalletCreationStatus, Guid>, IRepository<WalletCreationStatus>
  {
    #region Constructor
    public WalletCreationStatusRepository(ApplicationDbContext context) : base(context)
    {
    }
    #endregion

    #region Public Members
    public IQueryable<WalletCreationStatus> Query()
    {
      return _context.WalletCreationStatus.Select(entity => new WalletCreationStatus
      {
        Id = entity.Id,
        Name = entity.Name
      });
    }

    public Task<WalletCreationStatus> Create(WalletCreationStatus item)
    {
      throw new NotImplementedException();
    }

    public Task<WalletCreationStatus> Update(WalletCreationStatus item)
    {
      throw new NotImplementedException();
    }

    public Task Delete(WalletCreationStatus item)
    {
      throw new NotImplementedException();
    }
    #endregion
  }
}
